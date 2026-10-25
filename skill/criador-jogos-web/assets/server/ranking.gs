/**
 * MegaQuizz by Nerd de Segunda — servidor do ranking geral (Google Apps Script).
 *
 * Guarda as pontuações do Modo Episódios na folha "MegaQuizz — Ranking Geral".
 * Publicar como aplicação web: Implementar > Nova implementação > Aplicação Web,
 * Executar como "Eu", Quem tem acesso "Qualquer pessoa".
 *
 * GET  ?limit=100&id=<playerId>   -> { ok, total, entries: [...], me: {rank, points} }
 * POST { id, name, episodes: { "1": {best, completed}, ... } }  (Content-Type: text/plain)
 */
const SHEET_ID = '1vg6kfKvStNbZv5J1eXK2LA_MpGhapesQA2SOyMfTTRk';
const N_EPISODIOS = 10;
// Máximo teórico por episódio: 10 perguntas × 225 pts (Modo Lenda) + 3 sequências × 75 + 250 de conclusão.
const MAX_POR_EPISODIO = 2725;
const COLS = ['playerId', 'nome', 'pontos', 'episodiosConcluidos', 'melhoresPorEpisodio', 'actualizadoEm', 'criadoEm'];

function sheet_() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(COLS);
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function cleanName_(name) {
  return String(name || '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20);
}

function rows_() {
  return sheet_().getDataRange().getValues().slice(1).filter(function (r) { return r[0]; });
}

function ranked_() {
  return rows_()
    .map(function (r) {
      return { id: String(r[0]), name: String(r[1]), points: Number(r[2]) || 0, completed: Number(r[3]) || 0, updatedAt: String(r[5]) };
    })
    .sort(function (a, b) {
      return b.points - a.points || b.completed - a.completed || (a.updatedAt < b.updatedAt ? -1 : 1);
    });
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const limit = Math.max(1, Math.min(200, Number(p.limit) || 100));
  const all = ranked_();
  const out = { ok: true, total: all.length, updatedAt: new Date().toISOString(), entries: [] };
  all.slice(0, limit).forEach(function (r, i) {
    out.entries.push({ rank: i + 1, name: r.name, points: r.points, completed: r.completed, me: !!p.id && r.id === p.id });
  });
  if (p.id) {
    const idx = all.findIndex(function (r) { return r.id === p.id; });
    if (idx >= 0) out.me = { rank: idx + 1, points: all[idx].points, completed: all[idx].completed };
  }
  return json_(out);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'pedido inválido' });
  }
  const id = String(body.id || '');
  if (!/^[a-z0-9-]{16,64}$/.test(id)) return json_({ ok: false, error: 'identificador inválido' });
  const name = cleanName_(body.name);
  if (!name) return json_({ ok: false, error: 'nome em falta' });

  // Limite simples: um envio a cada 5 segundos por jogador.
  const cache = CacheService.getScriptCache();
  if (cache.get('rl:' + id)) return json_({ ok: false, error: 'demasiados pedidos, tenta daqui a pouco' });
  cache.put('rl:' + id, '1', 5);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const data = sh.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) if (String(data[i][0]) === id) { rowIndex = i; break; }

    // Melhor pontuação por episódio: nunca desce, e é limitada ao máximo teórico.
    const prev = rowIndex > 0 ? safeParse_(data[rowIndex][4]) : {};
    const eps = body.episodes || {};
    const merged = {};
    let points = 0;
    let completed = 0;
    for (let n = 1; n <= N_EPISODIOS; n++) {
      const a = prev[n] || { best: 0, completed: false };
      const b = eps[n] || { best: 0, completed: false };
      const best = Math.min(MAX_POR_EPISODIO, Math.max(0, Math.round(Math.max(Number(a.best) || 0, Number(b.best) || 0))));
      const done = !!(a.completed || b.completed);
      merged[n] = { best: best, completed: done };
      points += best;
      if (done) completed++;
    }
    const now = new Date().toISOString();
    const row = [id, name, points, completed, JSON.stringify(merged), now, rowIndex > 0 ? data[rowIndex][6] : now];
    if (rowIndex > 0) sh.getRange(rowIndex + 1, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    const all = ranked_();
    const rank = all.findIndex(function (r) { return r.id === id; }) + 1;
    return json_({ ok: true, rank: rank, points: points, completed: completed, total: all.length });
  } finally {
    lock.releaseLock();
  }
}

function safeParse_(s) {
  try { return JSON.parse(s) || {}; } catch (err) { return {}; }
}
