// Wraps src/app.html (an artifact-style page fragment: head bits, then markup,
// then one script) into a standalone document at dist/index.html, mirroring the
// Artifact runtime's skeleton so local and published builds render identically.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const frag = (await readFile(join(root, 'src/app.html'), 'utf8')).trim();

const cut = frag.indexOf('</style>') + '</style>'.length;
if (cut < 10) throw new Error('src/app.html: expected a <style> block in the head section');
const head = frag.slice(0, cut);
const body = frag.slice(cut);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Abalone for two players or against a computer: hex board, sumito pushes, first to push six marbles off the board wins.">
<style>
  :root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
  body{margin:0;font:14px system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
  img{max-width:100%}
  [hidden]{display:none!important}
</style>
${head}
</head>
<body>
${body}
</body>
</html>
`;

await mkdir(join(root, 'dist'), { recursive: true });
await writeFile(join(root, 'dist/index.html'), html);
await writeFile(join(root, 'index.html'), html); // GitHub Pages serves the repo root
console.log(`built dist/index.html and index.html  (${(html.length / 1024).toFixed(1)} kB)`);
