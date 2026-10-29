#!/usr/bin/env node
// Pesquisa e descarrega ficheiros do Wikimedia Commons com licença livre.
// Corre no GitHub Actions (workflow media-fetch.yml), porque a sessão de desenvolvimento
// pode não ter acesso ao Commons.
//   node scripts/commons.mjs search   → lê media-sources/queries.json, escreve media-raw/search-results.json
//   node scripts/commons.mjs download → lê media-sources/picks.json, descarrega para media-raw/ + credits.json
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'MegaQuizzNerdDeSegunda/1.0 (https://github.com/mauroyange/megaquizz-nerd-de-segunda)';
const OUT = 'media-raw';
const FREE = /^(public domain|pd|cc0|cc[ -]by(-sa)?[ -]?[0-9.]*|cc by(-sa)? [0-9.]+( [a-z]+)?)/i;

const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function describe(p) {
  const ii = p.imageinfo?.[0] ?? {};
  const m = ii.extmetadata ?? {};
  const license = strip(m.LicenseShortName?.value);
  return {
    title: p.title,
    mime: ii.mime,
    width: ii.width,
    height: ii.height,
    bytes: ii.size,
    seconds: ii.duration,
    url: ii.url,
    page: ii.descriptionurl,
    license,
    licenseUrl: m.LicenseUrl?.value,
    free: FREE.test(license),
    artist: strip(m.Artist?.value).slice(0, 160),
    description: strip(m.ImageDescription?.value).slice(0, 240),
  };
}

const IIPROP = 'url|size|mime|extmetadata';

fs.mkdirSync(OUT, { recursive: true });
const mode = process.argv[2];

if (mode === 'search') {
  const queries = JSON.parse(fs.readFileSync('media-sources/queries.json', 'utf8'));
  const results = {};
  for (const [key, query] of Object.entries(queries)) {
    const data = await api({
      action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '20',
      prop: 'imageinfo', iiprop: IIPROP, iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|ImageDescription',
    });
    results[key] = { query, files: (data.query?.pages ?? []).map(describe).filter((f) => f.free) };
    console.log(`${key}: ${results[key].files.length} livres`);
    await sleep(300);
  }
  fs.writeFileSync(path.join(OUT, 'search-results.json'), JSON.stringify(results, null, 2));
} else if (mode === 'download') {
  const picks = JSON.parse(fs.readFileSync('media-sources/picks.json', 'utf8'));
  const credits = {};
  for (const [name, spec] of Object.entries(picks)) {
    const title = typeof spec === 'string' ? spec : spec.title;
    const width = typeof spec === 'string' ? undefined : spec.width;
    const data = await api({
      action: 'query', titles: title, prop: 'imageinfo', iiprop: IIPROP,
      iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|ImageDescription',
      ...(width ? { iiurlwidth: String(width) } : {}),
    });
    const page = data.query?.pages?.[0];
    const info = page && describe(page);
    if (!info?.url || !info.free) {
      console.error(`✗ ${name}: ${title} (${info?.license ?? 'não encontrado'})`);
      continue;
    }
    const src = (width && page.imageinfo[0].thumburl) || info.url;
    const ext = path.extname(new URL(src).pathname).toLowerCase() || '.bin';
    const res = await fetch(src, { headers: { 'User-Agent': UA } });
    if (!res.ok) { console.error(`✗ ${name}: ${res.status}`); continue; }
    fs.writeFileSync(path.join(OUT, name + ext), Buffer.from(await res.arrayBuffer()));
    credits[name] = { ...info, file: name + ext };
    console.log(`✓ ${name}${ext} — ${info.license} — ${info.artist}`);
    await sleep(500);
  }
  fs.writeFileSync(path.join(OUT, 'credits.json'), JSON.stringify(credits, null, 2));
} else {
  console.error('uso: commons.mjs search|download');
  process.exit(1);
}
