# Abalone

A complete Abalone board game in one self-contained page: 61-cell hex board, full
sumito push rules, local two-player mode, and a computer opponent that runs an
alpha-beta search in a Web Worker so the board never freezes.

No bundler, no framework, no runtime dependencies. The whole game — board,
rules, AI, sound — is one HTML file.

```bash
npm start          # build, then serve at http://localhost:8080
npm run build      # write dist/index.html and ./index.html
npm test           # 15 rule and search tests
npm run selfplay   # engine vs engine, 4 full games
```

## The game

Each side has 14 marbles. Push six of your opponent's marbles off the board to win.

- Move 1, 2 or 3 of your own marbles, which must sit in a straight line.
- **In-line**: the column rolls along its own axis. **Broadside**: a line of 2 or 3
  steps sideways, and every landing space must be empty.
- **Sumito**: only an in-line move pushes, and only with more marbles in the line
  than your opponent (2v1, 3v1, 3v2). The space behind the pushed group must be
  empty, or off the board — which removes that marble for good. Never 3v3, and you
  can never push your own marbles.

Three openings are included: Standard, Belgian Daisy and German Daisy.

## Playing it

Click a marble to select it, then click a neighbour in line to add it (up to
three); clicking a selected end marble drops it again. Arrows appear around the
group — green is a move, copper is a push, red means a marble goes off the board.
Hovering an arrow highlights what it will push. You can also drag a selected
marble in the direction you want, or use the keys `W` `E` `A` `D` `Z` `X` for the
six directions, `U` to undo, `H` for a hint, `Esc` to clear.

Board coordinates follow the usual convention: rows `A`–`I` bottom to top,
columns numbered along the diagonals, so the corners are `A1` and `I9` and the
centre is `E5`.

## The computer opponent

| Setting | Search |
| --- | --- |
| Novice | depth 1, heavy randomness |
| Club player | depth 3, 0.45 s |
| Strong | iterative deepening to depth 7, 1.2 s |
| Expert | iterative deepening to depth 12, 3 s |

The engine (`makeEngine()` in [`src/app.html`](src/app.html)) is deliberately
plain so it can be stringified into a Worker:

- Axial hex coordinates, 61 cells, precomputed neighbour table.
- Moves are packed into a single 18-bit integer — type, anchor cell, group size,
  direction, axis, plus push and capture flags — so move generation allocates
  almost nothing.
- Negamax with alpha-beta, iterative deepening against a wall-clock deadline,
  a Zobrist-keyed transposition table, history-heuristic move ordering, and a
  quiescence search over capturing pushes so it does not miss tactics at the
  horizon.
- Evaluation: marbles captured (dominant), distance to centre, group cohesion,
  and a penalty for marbles exposed near the rim.
- Repeated positions are discouraged, so the AI will not shuffle a marble back
  and forth forever.

About 137k nodes/second in Node on this machine; the Strong setting searches
roughly 150k–200k nodes per move.

## Layout

```
src/app.html   the whole game — engine, UI, styles
build.mjs      wraps src/app.html into a standalone document
serve.mjs      static server for dist/
test/engine.js         loads makeEngine() out of src/app.html
test/rules.test.mjs    rule and search tests
test/selfplay.mjs      engine-vs-engine games
index.html     built output, committed so GitHub Pages can serve it
```

`src/app.html` is a page fragment (head bits, markup, one script) with no
`<html>`/`<body>` wrapper, so the same file can be published directly as a
Claude Artifact; `build.mjs` adds the wrapper for everywhere else.

## Deploy

The built `index.html` has no dependencies beyond a Google Fonts stylesheet, so
any static host works.

- **GitHub Pages**: Settings → Pages → deploy from `main`, folder `/ (root)`.
- **Anything else**: copy `dist/index.html` wherever you like.

Abalone® is a trademark of its publisher. This is a fan-made implementation.

## License

MIT
