#!/usr/bin/env node
// Prepara imagens e excertos de áudio para perguntas com multimédia.
// Requer ImageMagick (convert) e ffmpeg/ffprobe instalados.
//
// Imagem (gera public/media/img/<nome>.webp e, com --silhueta, <nome>-silhueta.webp):
//   node scripts/prepare-media.mjs imagem caminho/original.png <nome> [--silhueta] [--pixel] [--tamanho 360]
//   Fotografias: --recortar enche o quadrado (corta as sobras) e --gravidade north|center|south
//   escolhe o que fica; --cortar-topo 20 tira 20% de cima (por exemplo, um título que dava a resposta).
//
// Áudio (gera public/media/audio/<nome>.mp3, mono, com fade e volume normalizado):
//   node scripts/prepare-media.mjs audio caminho/musica.mp3 <nome> --inicio 42.5 [--duracao 8]
//
// O excerto nunca passa de MAX_CLIP_SECONDS (ver src/game/config.ts).
// Cada ficheiro gerado fica registado em public/media/manifest.json (tamanho e duração),
// que os testes usam para confirmar que todas as perguntas apontam para ficheiros válidos.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MAX_CLIP_SECONDS = 10;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outImg = path.join(root, 'public/media/img');
const outAudio = path.join(root, 'public/media/audio');
const manifestPath = path.join(root, 'public/media/manifest.json');

const [, , kind, input, name, ...rest] = process.argv;
const flag = (f) => rest.includes(f);
const opt = (f, def) => {
  const i = rest.indexOf(f);
  return i >= 0 ? rest[i + 1] : def;
};

function usage(msg) {
  if (msg) console.error(`Erro: ${msg}\n`);
  console.error('Uso:\n  imagem <ficheiro> <nome> [--silhueta] [--pixel] [--tamanho 360]\n  audio <ficheiro> <nome> --inicio <segundos> [--duracao 8]');
  process.exit(1);
}
if (!kind || !input || !name) usage();
if (!/^[a-z0-9-]+$/.test(name)) usage('o nome só pode ter letras minúsculas, números e hífenes');
if (!fs.existsSync(input)) usage(`não encontrei ${input}`);

const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { files: {} };
const record = (abs, info) => {
  const rel = path.relative(path.join(root, 'public'), abs).split(path.sep).join('/');
  manifest.files[rel] = { ...info, bytes: fs.statSync(abs).size };
  console.log(`✓ ${rel} (${Math.round(fs.statSync(abs).size / 1024)} KB${info.seconds ? `, ${info.seconds}s` : ''})`);
};

if (kind === 'imagem' || kind === 'image') {
  fs.mkdirSync(outImg, { recursive: true });
  const size = Number(opt('--tamanho', '360'));
  const filter = flag('--pixel') ? ['-filter', 'point'] : [];
  const top = Number(opt('--cortar-topo', '0'));
  const pre = top > 0 ? ['-gravity', 'south', '-crop', `100%x${100 - top}%+0+0`, '+repage'] : [];
  const fit = flag('--recortar')
    ? ['-resize', `${size}x${size}^`, '-gravity', opt('--gravidade', 'center'), '-extent', `${size}x${size}`]
    : ['-background', 'none', '-trim', '+repage', ...filter, '-resize', `${size}x${size}`, '-gravity', 'center', '-extent', `${size}x${size}`];
  const base = ['-auto-orient', ...pre, ...fit, '-strip'];
  const full = path.join(outImg, `${name}.webp`);
  execFileSync('convert', [input, ...base, '-quality', '88', full]);
  record(full, { kind: 'image' });
  if (flag('--silhueta')) {
    // Pinta tudo o que não é transparente de uma só cor: a forma fica, os detalhes desaparecem.
    const sil = path.join(outImg, `${name}-silhueta.webp`);
    execFileSync('convert', [input, ...base, '-fill', '#0b0b10', '-colorize', '100', '-quality', '88', sil]);
    record(sil, { kind: 'image', silhouetteOf: `media/img/${name}.webp` });
  }
} else if (kind === 'audio') {
  fs.mkdirSync(outAudio, { recursive: true });
  const start = Number(opt('--inicio', 'NaN'));
  if (!Number.isFinite(start)) usage('indica o início do excerto com --inicio <segundos>');
  const dur = Math.min(MAX_CLIP_SECONDS, Number(opt('--duracao', '8')));
  const fadeOut = Math.max(0, dur - 0.8);
  const out = path.join(outAudio, `${name}.mp3`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', String(start), '-t', String(dur), '-i', input,
    '-ac', '1', '-ar', '44100', '-b:a', '64k',
    '-af', `afade=t=in:d=0.3,afade=t=out:st=${fadeOut}:d=0.8,loudnorm=I=-16:TP=-1.5`,
    out,
  ]);
  const seconds = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', out]).toString().trim(),
  );
  if (seconds > MAX_CLIP_SECONDS + 0.3) {
    fs.unlinkSync(out);
    usage(`o excerto ficou com ${seconds.toFixed(1)}s (máximo ${MAX_CLIP_SECONDS}s)`);
  }
  record(out, { kind: 'audio', seconds: Math.round(seconds * 10) / 10, source: path.basename(input), start });
} else {
  usage(`tipo desconhecido: ${kind}`);
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
