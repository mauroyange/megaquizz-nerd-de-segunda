// Gera os ícones da PWA e da app Android a partir do logótipo oficial (SVG).
// Uso: node scripts/make-icons.cjs   (requer Playwright)
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

const root = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'src/assets/logo-vertical.svg'), 'utf8');
const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

// [ficheiro, tamanho, fracção da altura ocupada pelo logo, fundo]
const jobs = [
  ['public/icons/icon-192.png', 192, 0.78, '#0b0b10'],
  ['public/icons/icon-512.png', 512, 0.78, '#0b0b10'],
  ['public/icons/maskable-512.png', 512, 0.6, '#0b0b10'],
  ['public/icons/apple-touch-icon.png', 180, 0.78, '#0b0b10'],
  ['public/icons/favicon-64.png', 64, 0.9, '#0b0b10'],
  ['resources/icon-1024.png', 1024, 0.78, '#0b0b10'],
  ['resources/icon-foreground-1024.png', 1024, 0.5, 'transparent'],
  ['resources/splash-2732.png', 2732, 0.22, '#0b0b10'],
];

(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  for (const [file, size, frac, bg] of jobs) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg}">
      <img src="${dataUri}" style="height:${Math.round(size * frac)}px;width:auto;image-rendering:pixelated"></body></html>`);
    await page.waitForFunction(() => document.images[0].complete);
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    await page.screenshot({ path: path.join(root, file), omitBackground: bg === 'transparent' });
    console.log('✓', file);
  }
  await browser.close();
})();
