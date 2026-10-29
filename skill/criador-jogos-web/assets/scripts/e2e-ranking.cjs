// Teste do ranking online com um servidor simulado (não toca no servidor real).
// Uso: VITE_RANKING_URL=https://ranking.test/exec npm run build && npx vite preview --port 4175 &
//      URL=http://localhost:4175/ node scripts/e2e-ranking.cjs
const path = require('path');
const { execSync } = require('child_process');
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
const APP_URL = process.env.URL || 'http://localhost:4175/';
const esbuild = require('esbuild');
const bundled = esbuild.buildSync({ entryPoints: [path.join(__dirname, '..', 'src/data/questions/index.ts')], bundle: true, format: 'cjs', write: false, platform: 'node', define: { 'import.meta.env': '{}' } });
const mod = { exports: {} };
new Function('module', 'exports', 'require', bundled.outputFiles[0].text)(mod, mod.exports, require);
const ANSWERS = new Map(mod.exports.QUESTION_BANK.map((q) => [q.question, q.options['abcd'.indexOf(q.correctOptionId)]]));
async function answerRight(p) {
  const text = (await p.locator('.question-text').textContent()).trim();
  await p.locator('.answer').filter({ has: p.locator('.answer-text', { hasText: ANSWERS.get(text) }) }).first().click();
}
let failures = 0;
const ok = (c, m) => { console.log(`${c ? 'PASSOU' : 'FALHOU'}  ${m}`); if (!c) failures++; };

(async () => {
  const b = await pw.chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const store = new Map([['bot-0000000000000001', { name: 'Charamba', points: 5000, completed: 3 }]]);
  const posts = [];
  await ctx.route('https://ranking.test/**', async (route) => {
    const req = route.request();
    const ranked = () => [...store.entries()].sort((a, b) => b[1].points - a[1].points);
    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData());
      posts.push(body);
      const pts = Object.values(body.episodes).reduce((s, e) => s + e.best, 0);
      const done = Object.values(body.episodes).filter((e) => e.completed).length;
      store.set(body.id, { name: body.name, points: pts, completed: done });
      const r = ranked();
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, rank: r.findIndex(([id]) => id === body.id) + 1, points: pts, completed: done, total: r.length }) });
    }
    const id = new URL(req.url()).searchParams.get('id');
    const r = ranked();
    const entries = r.map(([k, v], i) => ({ rank: i + 1, name: v.name, points: v.points, completed: v.completed, me: k === id }));
    const idx = r.findIndex(([k]) => k === id);
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, total: r.length, entries, me: idx >= 0 ? { rank: idx + 1, points: r[idx][1].points, completed: r[idx][1].completed } : undefined }) });
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP_URL);
  await p.click('text=Ranking geral');
  await p.waitForSelector('.ranking-list li');
  ok((await p.locator('.ranking-list li').count()) === 1, 'Ranking mostra o jogador existente');
  await p.click('text=Jogar episódios');
  await p.locator('.ep-card').first().locator('button').click();
  for (let i = 0; i < 10; i++) {
    await p.waitForSelector('.answer:not([disabled])');
    await answerRight(p);
    await p.locator('.feedback').waitFor();
    await p.keyboard.press('Enter');
  }
  await p.waitForSelector('.share-rank');
  ok((await p.locator('.share-rank').textContent()).includes('Escreve o teu nome'), 'Sem nome, pede o nome antes de entrar no ranking');
  ok(posts.length === 0, 'Sem nome, nada é enviado');
  await p.fill('#player-name', 'Mauro Yange');
  await p.getByRole('button', { name: 'Entrar no ranking' }).click();
  await p.waitForSelector('.rank-ok');
  ok(posts.length === 1 && posts[0].name === 'Mauro Yange', 'Envia o nome e as pontuações ao carregar no botão');
  ok(Object.keys(posts[0]).sort().join() === 'episodes,id,name', 'Envia só id anónimo, nome e pontuações');
  console.log('      ', (await p.locator('.rank-ok').textContent()).trim());
  await p.getByRole('button', { name: 'Ver ranking geral' }).click();
  await p.waitForSelector('.ranking-list li.me');
  ok((await p.locator('.ranking-list li').count()) === 2, 'Ranking passa a ter 2 jogadores');
  ok((await p.locator('.ranking-list li.me .r-name').textContent()).includes('Mauro Yange'), 'O jogador aparece destacado como "(tu)"');
  await p.screenshot({ path: process.env.SHOT || 'ranking.png', fullPage: true });
  // Nova partida: com nome definido, o envio é automático
  await p.click('text=Jogar episódios');
  await p.locator('.ep-card').first().locator('button').click();
  for (let i = 0; i < 10; i++) {
    await p.waitForSelector('.answer:not([disabled])');
    await answerRight(p);
    await p.locator('.feedback').waitFor();
    await p.keyboard.press('Enter');
  }
  await p.waitForSelector('.rank-ok', { timeout: 10000 });
  ok(posts.length === 2, 'Com nome definido, o resultado é enviado automaticamente');
  ok(errs.length === 0, `Sem erros na consola${errs.length ? ': ' + errs.join(' | ') : ''}`);
  await b.close();
  console.log(failures ? `\n${failures} verificação(ões) falharam.` : '\nTodas as verificações passaram.');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
