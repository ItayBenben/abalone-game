import test from 'node:test';
import assert from 'node:assert/strict';
import { E, at, board, named, find, cellsOf, DIR, NAME, OPENING_STANDARD } from './engine.js';

const legal = (b, p) => E.legalFor(b, p);
const push = (m) => !!E.dec(m).push;
const cap = (m) => !!E.dec(m).cap;

test('the board is a hexagon of 61 cells', () => {
  assert.equal(E.N, 61);
  assert.equal(E.QR.filter(([q, r]) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) === 4).length, 24);
  for (let d = 0; d < 6; d++) assert.ok(E.NB[at('E5') * 6 + d] >= 0, 'centre has all six neighbours');
  assert.equal(E.NB[at('A1') * 6 + DIR.SW], -1, 'the rim has gaps');
});

test('the standard opening gives each side 14 marbles', () => {
  assert.equal(OPENING_STANDARD.filter((v) => v === 1).length, 14);
  assert.equal(OPENING_STANDARD.filter((v) => v === 2).length, 14);
});

test('opening moves: no contact yet, and both sides mirror each other', () => {
  const black = legal(OPENING_STANDARD, 1);
  const white = legal(OPENING_STANDARD, 2);
  assert.equal(black.length, white.length, 'the opening is point-symmetric');
  assert.ok(black.length > 30 && black.length < 80, 'plausible move count, got ' + black.length);
  assert.equal(new Set(black).size, black.length, 'no duplicate moves');
  assert.equal(black.filter(push).length, 0, 'the armies cannot touch yet');
  for (const m of black) assert.ok(E.dec(m).k >= 1 && E.dec(m).k <= 3, 'never more than three marbles');
});

test('2 against 1 with a gap behind is a legal push', () => {
  const b = board({ 1: 'E3 E4', 2: 'E5' });
  const m = find(legal(b, 1), 'E3 E4', DIR.E);
  assert.equal(m.length, 1);
  assert.ok(push(m[0]) && !cap(m[0]));
  const { after, restored } = E.probe(b, [0, 0, 0], m[0]);
  assert.equal(after[at('E3')], 0);
  assert.equal(after[at('E4')], 1);
  assert.equal(after[at('E5')], 1);
  assert.equal(after[at('E6')], 2, 'the white marble slid one space');
  assert.deepEqual(restored, b, 'undo restores the position exactly');
});

test('2 against 2 and 3 against 3 are blocked', () => {
  assert.equal(find(legal(board({ 1: 'E3 E4', 2: 'E5 E6' }), 1), 'E3 E4', DIR.E).length, 0);
  assert.equal(find(legal(board({ 1: 'E2 E3 E4', 2: 'E5 E6 E7' }), 1), 'E2 E3 E4', DIR.E).length, 0);
});

test('3 against 2 is legal unless something sits behind the pushed group', () => {
  assert.equal(find(legal(board({ 1: 'E2 E3 E4', 2: 'E5 E6' }), 1), 'E2 E3 E4', DIR.E).length, 1);
  assert.equal(find(legal(board({ 1: 'E2 E3 E4', 2: 'E5 E6 E7' }), 1), 'E2 E3 E4', DIR.E).length, 0);
  assert.equal(find(legal(board({ 1: 'E2 E3 E4 E8', 2: 'E5 E6' }), 1), 'E2 E3 E4', DIR.E).length, 1);
  assert.equal(find(legal(board({ 1: 'E2 E3 E4 E7', 2: 'E5 E6' }), 1), 'E2 E3 E4', DIR.E).length, 0,
    'own marble parked where the pushed group would land');
});

test('pushing a marble over the edge removes it and scores', () => {
  const b = board({ 1: 'E7 E8', 2: 'E9' });
  const m = find(legal(b, 1), 'E7 E8', DIR.E);
  assert.equal(m.length, 1);
  assert.ok(cap(m[0]), 'flagged as a capture');
  const { after, scAfter, restored, scRestored } = E.probe(b, [0, 0, 0], m[0]);
  assert.equal(after.filter((v) => v === 2).length, 0, 'white marble is off the board');
  assert.equal(after[at('E9')], 1);
  assert.equal(scAfter[1], 1);
  assert.deepEqual(restored, b);
  assert.deepEqual(scRestored, [0, 0, 0], 'undo gives the marble back');
});

test('you can never push your own marbles', () => {
  const b = board({ 1: 'E3 E4 E5 E6' });
  assert.equal(find(legal(b, 1), 'E3 E4 E5', DIR.E).length, 0);
  assert.equal(find(legal(b, 1), 'E4 E5 E6', DIR.E).length, 1, 'but the front three may still roll on');
  for (const m of legal(b, 1)) assert.ok(E.dec(m).k <= 3);
});

test('a broadside move needs every landing space empty and never pushes', () => {
  const open = board({ 1: 'E4 E5' });
  assert.equal(find(legal(open, 1), 'E4 E5', DIR.NE).length, 1);
  const blocked = board({ 1: 'E4 E5', 2: 'F5' });
  assert.equal(find(legal(blocked, 1), 'E4 E5', DIR.NE).length, 0, 'F5 is occupied');
  for (const m of legal(open, 1)) if (E.dec(m).type === 1) assert.ok(!push(m) && !cap(m));
});

test('a lone marble steps into empty neighbours and never off the board', () => {
  const ms = legal(board({ 1: 'A1' }), 1);
  assert.equal(ms.length, 3, 'the A1 corner touches exactly three cells');
  for (const m of ms) assert.equal(cellsOf(m).length, 1);
});

test('every generated move survives apply + undo unchanged', () => {
  for (const player of [1, 2])
    for (const m of legal(OPENING_STANDARD, player)) {
      const { restored, scRestored } = E.probe(OPENING_STANDARD, [0, 0, 0], m);
      assert.deepEqual(restored, OPENING_STANDARD, 'broken by ' + named(m));
      assert.deepEqual(scRestored, [0, 0, 0]);
    }
});

test('the search takes a free capture when one is on offer', () => {
  const b = board({ 1: 'E7 E8 D5 C4', 2: 'E9 A1 A2 B3' });
  const res = E.bestMove(b, [0, 0, 0], 1, { maxDepth: 4, timeMs: 1500 });
  assert.ok(res.move, 'a move was returned');
  assert.ok(legal(b, 1).includes(res.move), 'and it is legal');
  assert.ok(cap(res.move), 'it pushes the stranded white marble off, got ' + named(res.move));
});

test('the search will not walk a marble onto a square where it gets pushed off', () => {
  const b = board({ 1: 'E8 C3 C4', 2: 'E6 E7 G6 G7' });
  const res = E.bestMove(b, [0, 0, 0], 1, { maxDepth: 4, timeMs: 1500 });
  const moved = cellsOf(res.move);
  const ontoEdge = moved.length === 1 && moved[0] === at('E8') && E.dec(res.move).d === DIR.E;
  assert.ok(!ontoEdge, 'played ' + named(res.move) + ' instead of stepping onto E9');
});

test('the sixth capture is seen as a win', () => {
  const b = board({ 1: 'E7 E8', 2: 'E9' });
  const res = E.bestMove(b, [0, 5, 0], 1, { maxDepth: 3, timeMs: 1200 });
  assert.ok(cap(res.move));
  assert.ok(res.score > 1e6, 'score ' + res.score + ' signals a win');
});

test('cell names round-trip (A1..A5, E1..E9, I5..I9)', () => {
  assert.equal(NAME.get(at('A1')), 'A1');
  assert.equal(NAME.get(at('I9')), 'I9');
  assert.equal([...NAME.values()].filter((n) => n[0] === 'E').length, 9);
  assert.equal([...NAME.values()].filter((n) => n[0] === 'A').length, 5);
});
