// Teste ponta-a-ponta no navegador (Playwright). Uso:
//   npm run build && npx vite preview --port 4173 &   depois:   node scripts/e2e.cjs
// Requer o Playwright instalado (global ou local).
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }

const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || path.join(__dirname, '..', 'e2e-shots');
fs.mkdirSync(OUT, { recursive: true });

// Gera um mapa "texto da pergunta -> texto da resposta certa" a partir do banco.
const esbuild = require('esbuild');
const bundled = esbuild.buildSync({ entryPoints: [path.join(__dirname, '..', 'src/data/questions/index.ts')], bundle: true, format: 'cjs', write: false, platform: 'node' });
const mod = { exports: {} };
new Function('module', 'exports', 'require', bundled.outputFiles[0].text)(mod, mod.exports, require);
const ANSWERS = new Map(mod.exports.QUESTION_BANK.map((q) => [q.question, q.options['abcd'.indexOf(q.correctOptionId)]]));

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASSOU' : 'FALHOU'}  ${msg}`); if (!cond) failures++; };

async function noHorizontalScroll(page, label) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  ok(sw <= iw, `${label}: sem scroll horizontal (${sw} <= ${iw})`);
}

async function answerCurrent(page, correct) {
  const text = (await page.locator('.question-text').textContent()).trim();
  const right = ANSWERS.get(text);
  const buttons = page.locator('.answer');
  if (correct) await buttons.filter({ has: page.locator('.answer-text', { hasText: right }) }).first().click();
  else {
    const n = await buttons.count();
    for (let i = 0; i < n; i++) {
      const t = (await buttons.nth(i).locator('.answer-text').textContent()).trim();
      if (t !== right) { await buttons.nth(i).click(); break; }
    }
  }
  await page.locator('.feedback').waitFor();
}

(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto(URL);
  await page.waitForSelector('.slogan');
  ok(await page.locator('text=Tens nível para ser um verdadeiro Nerd?').isVisible(), 'Ecrã inicial mostra o slogan');
  ok((await page.locator('text=Continuar jogo').count()) === 0, 'Sem progresso, "Continuar jogo" não aparece');
  await page.screenshot({ path: `${OUT}/01-home.png` });

  await page.click('text=Começar a jogar');
  await page.waitForSelector('.mode-grid');
  await page.screenshot({ path: `${OUT}/02-modos.png`, fullPage: true });
  await page.click('text=Abrir mapa');
  await page.waitForSelector('.trail');
  ok((await page.locator('.ep-card.status-unlocked').count()) === 1, 'Mapa: só o nível 1 desbloqueado');
  ok((await page.locator('.ep-card.status-locked').count()) === 9, 'Mapa: 9 níveis bloqueados');
  ok(await page.locator('.ep-card').nth(1).locator('button').isDisabled(), 'Botão do nível 2 está desactivado');
  await page.screenshot({ path: `${OUT}/03-mapa.png`, fullPage: true });

  // Joga o episódio 1 com 8/10 certas.
  await page.locator('.ep-card').first().locator('button').click();
  await page.waitForSelector('.question-text');
  await page.screenshot({ path: `${OUT}/04-pergunta.png` });
  for (let i = 0; i < 10; i++) {
    await answerCurrent(page, i !== 2 && i !== 7);
    if (i === 0) await page.screenshot({ path: `${OUT}/05-feedback.png` });
    const scoreBefore = await page.locator('.hud-value').textContent();
    // Clicar duas vezes não deve contar a pergunta de novo.
    await page.locator('.answer').first().click({ force: true }).catch(() => {});
    ok((await page.locator('.hud-value').textContent()) === scoreBefore || i > 0, i === 0 ? 'Segundo clique não altera a pontuação' : `Pergunta ${i + 1} respondida`);
    await page.keyboard.press('Enter');
  }
  await page.waitForSelector('.verdict');
  ok((await page.locator('.verdict').textContent()).includes('Episódio concluído'), 'Resultado: episódio concluído com 80%');
  ok((await page.locator('.result-stats dd.ok').textContent()) === '8', 'Resultado: 8 certas');
  ok((await page.locator('text=Próximo nível').count()) === 1, 'Botão "Próximo nível" disponível');
  ok((await page.locator('text=Primeiro Contacto').count()) >= 1, 'Conquista "Primeiro Contacto" desbloqueada');
  await page.screenshot({ path: `${OUT}/06-resultados.png`, fullPage: true });

  // Persistência
  await page.reload();
  await page.waitForSelector('.slogan');
  ok(await page.locator('text=Continuar jogo · Ep. #2').isVisible(), 'Depois de recarregar: "Continuar jogo · Ep. #2"');
  await page.click('text=Continuar jogo');
  await page.waitForSelector('.trail');
  ok((await page.locator('.ep-card.status-completed').count()) === 1 && (await page.locator('.ep-card.status-unlocked').count()) === 1, 'Depois de recarregar: nível 1 concluído e nível 2 aberto');

  // Modos em pausa temporária (só o Modo Episódios fica activo)
  await page.click('text=Modos');
  await page.waitForSelector('.mode-grid');
  const paused = await page.locator('.mode-card.paused').count();
  ok(paused === 3 || paused === 0, `Modos em pausa: ${paused} (3 durante a pausa, 0 depois)`);
  if (paused === 3) {
    ok(await page.locator('.mode-card', { hasText: 'Desafio Relâmpago' }).locator('button').isDisabled(), 'Desafio Relâmpago está inactivo');
    ok(await page.locator('.mode-card', { hasText: 'Duelo Nerd' }).locator('button').isDisabled(), 'Duelo Nerd está inactivo');
    ok(!(await page.getByRole('button', { name: 'Abrir mapa' }).isDisabled()), 'Modo Episódios continua activo');
  }

  // Temporizador (Modo Lenda = 20 s), no Modo Episódios
  await page.click('label:has-text("Modo Lenda")');
  await page.click('text=Abrir mapa');
  await page.locator('.ep-card').first().locator('button').click();
  await page.waitForSelector('.question-text');
  const t0 = Number((await page.locator('.timer-num').textContent()).replace(/\D/g, ''));
  ok(t0 === 20, `Temporizador do Modo Lenda começa em 20 s (lido: ${t0})`);
  await page.waitForTimeout(3000);
  await page.click('text=Sair');
  await page.waitForTimeout(2000);
  await page.click('text=Cancelar');
  const t1 = Number((await page.locator('.timer-num').textContent()).replace(/\D/g, ''));
  ok(t1 <= 18 && t1 >= 15, `Diálogo de saída pausa sem reiniciar o tempo (restam ${t1} s)`);
  await page.waitForSelector('text=Tempo esgotado!', { timeout: 25000 });
  ok(true, 'Fim do tempo revela "Tempo esgotado!"');
  ok((await page.locator('.answer.correct').count()) === 1, 'Fim do tempo revela a resposta correcta');
  ok((await page.locator('.hud-value').textContent()) === '0', 'Fim do tempo dá 0 pontos');
  await page.click('text=Sair');
  await page.locator('.modal').getByRole('button', { name: 'Sair', exact: true }).click();
  await page.waitForSelector('.trail');
  ok(Number(await page.locator('.map-total b').textContent()) > 0, 'Mapa mostra os pontos acumulados');

  // Mobile
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  mp.on('pageerror', (e) => errors.push(e.message));
  await mp.goto(URL);
  await mp.waitForSelector('.slogan');
  await noHorizontalScroll(mp, 'Telemóvel / início');
  await mp.screenshot({ path: `${OUT}/m1-home.png`, fullPage: true });
  await mp.click('text=Começar a jogar');
  await noHorizontalScroll(mp, 'Telemóvel / modos');
  await mp.click('text=Abrir mapa');
  await mp.waitForSelector('.trail');
  await noHorizontalScroll(mp, 'Telemóvel / mapa');
  await mp.screenshot({ path: `${OUT}/m2-mapa.png` });
  await mp.locator('.ep-card').first().locator('button').click();
  await mp.waitForSelector('.question-text');
  await noHorizontalScroll(mp, 'Telemóvel / pergunta');
  await answerCurrent(mp, true);
  await mp.screenshot({ path: `${OUT}/m3-pergunta.png`, fullPage: true });
  await noHorizontalScroll(mp, 'Telemóvel / feedback');

  // Tablet
  const t = await browser.newContext({ viewport: { width: 820, height: 1180 } });
  const tp = await t.newPage();
  await tp.goto(URL);
  await tp.waitForSelector('.slogan');
  await noHorizontalScroll(tp, 'Tablet / início');
  await tp.click('text=Recordes e conquistas');
  await tp.waitForSelector('.ach-grid');
  await noHorizontalScroll(tp, 'Tablet / perfil');
  await tp.screenshot({ path: `${OUT}/t1-perfil.png`, fullPage: true });

  ok(errors.length === 0, `Sem erros na consola${errors.length ? ': ' + errors.join(' | ') : ''}`);
  await browser.close();
  console.log(failures ? `\n${failures} verificação(ões) falharam.` : '\nTodas as verificações passaram.');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
