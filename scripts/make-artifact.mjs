// Junta dist-artifact/ num único fragmento HTML (artifact/megaquizz.html).
import fs from 'node:fs';
import path from 'node:path';

const dist = 'dist-artifact';
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const js = fs.readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(dist, 'assets', f), 'utf8')).join('\n');
const css = fs.readdirSync(path.join(dist, 'assets')).filter((f) => f.endsWith('.css')).map((f) => fs.readFileSync(path.join(dist, 'assets', f), 'utf8')).join('\n');
const fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];

const out = `<title>MegaQuizz by Nerd de Segunda</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>${css}</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script type="module">${js.replace(/<\/script/g, '<\\/script')}</script>
`;
fs.mkdirSync('artifact', { recursive: true });
fs.writeFileSync('artifact/megaquizz.html', out);
console.log(`artifact/megaquizz.html: ${(out.length / 1024).toFixed(0)} KB`);
