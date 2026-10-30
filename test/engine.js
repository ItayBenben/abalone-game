// Loads makeEngine() straight out of src/app.html so the tests exercise the
// exact code that ships in the page.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = await readFile(join(root, 'src/app.html'), 'utf8');
const start = src.indexOf('function makeEngine(){');
const end = src.indexOf('const E=makeEngine();');
if (start < 0 || end < 0) throw new Error('could not locate makeEngine() in src/app.html');

export const makeEngine = new Function(src.slice(start, end) + '\nreturn makeEngine;')();
export const E = makeEngine();

// cell naming: rows A (bottom) .. I (top), column number = q + 5
export const NAME = new Map();
export const IDX = new Map();
E.QR.forEach(([q, r], i) => {
  const n = String.fromCharCode(69 - r) + (q + 5);
  NAME.set(i, n);
  IDX.set(n, i);
});
export const at = (name) => {
  if (!IDX.has(name)) throw new Error('no such cell: ' + name);
  return IDX.get(name);
};
export const board = (spec) => {
  const b = new Array(E.N).fill(0);
  for (const [color, cells] of Object.entries(spec))
    for (const c of cells.split(/\s+/).filter(Boolean)) b[at(c)] = Number(color);
  return b;
};
export const cellsOf = (m) => {
  const d = E.dec(m), out = [d.idx];
  const step = d.type === 0 ? (d.d + 3) % 6 : d.a;
  let c = d.idx;
  for (let j = 1; j < d.k; j++) { c = E.NB[c * 6 + step]; out.push(c); }
  return out;
};
export const named = (m) => cellsOf(m).map((c) => NAME.get(c)).sort().join('+');
export const find = (moves, cells, dir) =>
  moves.filter((m) => named(m) === cells.split(/\s+/).sort().join('+') && E.dec(m).d === dir);
export const DIR = { E: 0, NE: 1, NW: 2, W: 3, SW: 4, SE: 5 };
export const OPENING_STANDARD = board({
  1: 'A1 A2 A3 A4 A5 B1 B2 B3 B4 B5 B6 C3 C4 C5',
  2: 'I5 I6 I7 I8 I9 H4 H5 H6 H7 H8 H9 G5 G6 G7',
});
