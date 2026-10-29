// Teste das perguntas com imagem e som. Precisa de uma build de teste:
//   VITE_TEST_MEDIA_FIRST=1 VITE_DEMO_AUDIO=1 VITE_RANKING_URL=https://ranking.test/exec npx vite build --outDir <dir>
//   (copiar um mp3 de teste para <dir>/media/audio/demo-tom.mp3), servir e: URL=... node scripts/e2e-media.cjs
const path = require('path');
const { execSync } = require('child_process');
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const esbuild = require('esbuild');
const APP_URL = process.env.URL || 'http://localhost:4176/';
const OUT = process.env.OUT || '.';
const bundled = esbuild.buildSync({ entryPoints: [path.join(__dirname, '..', 'src/data/questions/index.ts')], bundle: true, format: 'cjs', write: false, platform: 'node', define: { 'import.meta.env': '{"VITE_DEMO_AUDIO":"1"}' } });
const mod = { exports: {} };
new Function('module', 'exports', 'require', bundled.outputFiles[0].text)(mod, mod.exports, require);
const ANSWERS = new Map(mod.exports.QUESTION_BANK.map((q) => [q.question, q.options['abcd'.indexOf(q.correctOptionId)]]));
let failures = 0;
const ok = (c, m) => { console.log(`${c ? 'PASSOU' : 'FALHOU'}  ${m}`); if (!c) failures++; };
const answerRight = async (p) => {
  const text = (await p.locator('.question-text').textContent()).trim();
  await p.locator('.answer').filter({ has: p.locator('.answer-text', { hasText: ANSWERS.get(text) }) }).first().click();
  await p.locator('.feedback').waitFor();
};
const unlockUntil = (n) => JSON.stringify({ version: 1, episodes: Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, { completed: true, bestScore: 100, bestAccuracy: 1, bestDifficulty: 'casual', plays: 1, masteredIds: [], bestTimeMs: 1 }])), records: {}, achievements: {}, stats: { sessions: 1 }, settings: { difficulty: 'casual', sound: true, playerName: '' }, playerId: 'teste-0000000000000000' });

(async () => {
  const b = await pw.chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route('https://ranking.test/**', (r) => r.fulfill({ contentType: 'application/json', body: '{"ok":true,"total":0,"entries":[]}' }));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP_URL);
  await p.evaluate((v) => localStorage.setItem('megaquizz-nds:progress:v1', v), unlockUntil(3));
  await p.goto(APP_URL);

  // Episódio 1: silhueta + áudio
  await p.click('text=Começar a jogar');
  await p.click('text=Abrir mapa');
  await p.locator('.ep-card').first().locator('button').click();
  await p.waitForSelector('.q-image img');
  const src1 = await p.locator('.q-image img').getAttribute('src');
  ok(src1.includes('silhueta'), `Mostra a silhueta (${src1})`);
  ok(await p.locator('.q-image img').evaluate((i) => i.complete && i.naturalWidth > 0), 'A imagem carregou');
  await p.screenshot({ path: `${OUT}/media-1-silhueta.png`, fullPage: true });
  await answerRight(p);
  const src2 = await p.locator('.q-image img').getAttribute('src');
  ok(!src2.includes('silhueta') && (await p.locator('.q-image figcaption').count()) === 1, 'Depois de responder revela a imagem original');
  await p.screenshot({ path: `${OUT}/media-2-revelado.png`, fullPage: true });
  await p.keyboard.press('Enter');

  // Avança pelas outras perguntas com imagem até chegar à do excerto de som.
  for (let i = 0; i < 6 && !(await p.locator('.q-audio').count()); i++) {
    await p.waitForTimeout(500);
    if (await p.locator('.q-audio').count()) break;
    await answerRight(p);
    await p.keyboard.press('Enter');
  }
  await p.waitForSelector('.q-audio');
  const t0 = Number((await p.locator('.timer-num').textContent()).replace(/\D/g, ''));
  ok(t0 >= 39 && t0 <= 40, `Pergunta com som tem tempo extra (${t0}s em vez de 30s)`);
  await p.waitForTimeout(1500);
  const playing = await p.locator('.q-audio audio').evaluate((a) => !a.paused && a.currentTime > 0.5);
  ok(playing, 'O excerto começa a tocar sozinho');
  await p.screenshot({ path: `${OUT}/media-3-audio.png`, fullPage: true });
  await p.locator('.audio-btn').click();
  ok(await p.locator('.q-audio audio').evaluate((a) => a.paused), 'O botão pára o excerto');
  await p.keyboard.press('p');
  await p.waitForTimeout(300);
  ok(await p.locator('.q-audio audio').evaluate((a) => !a.paused), 'A tecla P volta a tocar');
  await answerRight(p);
  ok((await p.locator('.feedback').textContent()).includes('Excerto:'), 'Mostra o crédito do excerto');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(200);
  ok((await p.locator('.q-audio').count()) === 0, 'O leitor desaparece na pergunta seguinte');

  // Episódio 4: alternativas em imagem
  await p.click('text=Sair');
  await p.locator('.modal').getByRole('button', { name: 'Sair', exact: true }).click();
  await p.waitForSelector('.trail');
  await p.locator('.ep-card').nth(3).locator('button').click();
  await p.waitForSelector('.question-text');
  for (let i = 0; i < 3 && (await p.locator('.answer-img').count()) === 0; i++) {
    await answerRight(p);
    await p.keyboard.press('Enter');
    await p.waitForSelector('.question-text');
  }
  ok((await p.locator('.answer-img').count()) === 4, 'Pergunta com 4 alternativas em imagem');
  ok(await p.locator('.answer-img').evaluateAll((ims) => ims.every((i) => i.complete && i.naturalWidth > 0)), 'As 4 imagens carregaram');
  const { sw, iw } = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  ok(sw <= iw, `Sem scroll horizontal no telemóvel (${sw} <= ${iw})`);
  await p.screenshot({ path: `${OUT}/media-4-opcoes.png`, fullPage: true });
  await answerRight(p);

  // Ficheiro em falta: a pergunta é trocada por uma de texto
  const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', (e) => errs.push(e.message));
  await p2.route('**/media/img/nds-conselho-silhueta.webp', (r) => r.abort());
  await p2.goto(APP_URL);
  await p2.click('text=Começar a jogar');
  await p2.click('text=Abrir mapa');
  await p2.locator('.ep-card').first().locator('button').click();
  await p2.waitForSelector('.question-text');
  ok(!(await p2.locator('.question-text').textContent()).includes('silhueta'), 'Se a imagem não carrega, a pergunta é trocada por outra');

  ok(errs.length === 0, `Sem erros na consola${errs.length ? ': ' + errs.join(' | ') : ''}`);
  await b.close();
  console.log(failures ? `\n${failures} verificação(ões) falharam.` : '\nTodas as verificações passaram.');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
