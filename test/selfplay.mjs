// Plays whole games engine-vs-engine. Checks that games terminate, that the
// stronger setting actually wins, and prints a rough nodes/second figure.
import { E, OPENING_STANDARD, named } from './engine.js';

const LEVELS = {
  novice: { maxDepth: 1, timeMs: 60, noise: 900, randomChance: 0.22 },
  club: { maxDepth: 3, timeMs: 180, noise: 240, randomChance: 0.03 },
  strong: { maxDepth: 7, timeMs: 400, noise: 40, randomChance: 0 },
};

function game(blackLv, whiteLv, maxPlies = 300) {
  let board = OPENING_STANDARD.slice(), sc = [0, 0, 0], turn = 1, plies = 0, nodes = 0, ms = 0;
  const seen = [];
  while (plies < maxPlies) {
    const res = E.bestMove(board, sc, turn, turn === 1 ? blackLv : whiteLv);
    if (!res.move) return { winner: 0, plies, sc, nodes, ms };
    nodes += res.nodes; ms += res.ms;
    const out = E.probe(board, sc, res.move);
    board = out.after; sc = out.scAfter; plies++;
    seen.push(E.hashFor(board));
    if (sc[turn] >= 6) return { winner: turn, plies, sc, nodes, ms };
    turn = 3 - turn;
  }
  return { winner: 0, plies, sc, nodes, ms };
}

const games = Number(process.argv[2] || 4);
let strongWins = 0, decided = 0, totalNodes = 0, totalMs = 0;
for (let g = 0; g < games; g++) {
  const strongIsBlack = g % 2 === 0;
  const r = game(strongIsBlack ? LEVELS.strong : LEVELS.novice,
                 strongIsBlack ? LEVELS.novice : LEVELS.strong);
  const strongSide = strongIsBlack ? 1 : 2;
  totalNodes += r.nodes; totalMs += r.ms;
  if (r.winner) { decided++; if (r.winner === strongSide) strongWins++; }
  console.log(`game ${g + 1}: ${r.winner ? (r.winner === strongSide ? 'strong' : 'novice') + ' wins' : 'unfinished'}` +
    `  ${r.sc[1]}-${r.sc[2]}  ${r.plies} plies`);
}
console.log(`\nstrong won ${strongWins}/${decided} decided games`);
console.log(`search speed ≈ ${Math.round(totalNodes / (totalMs / 1000) / 1000)}k nodes/s`);
if (decided && strongWins < decided) {
  console.error('FAIL: the stronger setting lost a game');
  process.exit(1);
}
