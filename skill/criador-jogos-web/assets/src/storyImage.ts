import logoVertical from '../assets/logo-vertical.svg';
import { GAME_URL_SHORT } from '../utils/platform';

/** Dados mostrados na imagem de partilha (formato stories, 1080×1920). */
export interface StoryData {
  playerName: string;
  /** Linha de contexto, ex.: "Ep. #6 · OldBig3 dos animes · Nerd". */
  context: string;
  verdict: string;
  /** Valor principal (pontos ou certas seguidas) e a sua legenda. */
  bigValue: string;
  bigLabel: string;
  stats: Array<{ label: string; value: string }>;
  badges: string[];
  newRecord: boolean;
  /** Duelo: os dois jogadores e as pontuações. */
  duel?: Array<{ name: string; score: number; winner: boolean }>;
}

export const STORY_W = 1080;
export const STORY_H = 1920;

const C = {
  bg: '#0b0b10',
  surface: '#14141c',
  line: '#2d2d3c',
  fg: '#f4f2ec',
  muted: '#a7a7bb',
  teal: '#00c3aa',
  red: '#ff1c25',
  indigo: '#5861b1',
  amber: '#ffbc00',
};
const PIXEL = "'Press Start 2P', 'Courier New', monospace";
const DISPLAY = "'Chakra Petch', 'Trebuchet MS', sans-serif";
const BODY = "'Rubik', system-ui, sans-serif";

const CORNER: Array<[number, number, string]> = [
  [0, 0, C.teal], [1, 0, C.amber], [0, 1, C.red], [2, 0, C.indigo], [0, 2, C.amber], [1, 1, C.indigo],
  [3, 0, C.teal], [0, 3, C.teal], [2, 1, C.red], [1, 2, C.teal], [4, 0, C.red], [0, 4, C.indigo],
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível carregar o logótipo.'));
    img.src = src;
  });
}

async function ensureFonts() {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`40px ${PIXEL}`),
    document.fonts.load(`700 40px ${DISPLAY}`),
    document.fonts.load(`500 40px ${BODY}`),
  ]).catch(() => undefined);
}

/** Reduz o tamanho da letra até o texto caber na largura dada. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, font: (s: number) => string, min = 20) {
  let size = start;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxWidth && size > min) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

function shadowText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, shadow: string, off: number) {
  ctx.fillStyle = shadow;
  ctx.fillText(text, x + off, y + off);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** Desenha a imagem de partilha num canvas 1080×1920. */
export async function drawStory(canvas: HTMLCanvasElement, d: StoryData) {
  await ensureFonts();
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível.');
  const cx = STORY_W / 2;

  // Fundo e grelha de pontos
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let y = 18; y < STORY_H; y += 36) for (let x = 18; x < STORY_W; x += 36) ctx.fillRect(x, y, 3, 3);

  // Pixels de canto (como no fundo oficial do programa)
  const s = 44;
  for (const [x, y, c] of CORNER) {
    ctx.fillStyle = c;
    ctx.fillRect(x * s, y * s, s, s);
    ctx.fillRect(STORY_W - (x + 1) * s, STORY_H - (y + 1) * s, s, s);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Logótipo oficial + wordmark
  try {
    const logo = await loadImage(logoVertical);
    const h = 230;
    const w = (logo.naturalWidth / logo.naturalHeight) * h || h * 0.8;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(logo, cx - w / 2, 230, w, h);
  } catch {
    /* sem logótipo, a imagem continua válida */
  }
  ctx.font = `76px ${PIXEL}`;
  const mega = 'MEGA';
  const quizz = 'QUIZZ';
  const wMega = ctx.measureText(mega).width;
  const wQuizz = ctx.measureText(quizz).width;
  const gap = 18;
  const startX = cx - (wMega + gap + wQuizz) / 2;
  ctx.textAlign = 'left';
  shadowText(ctx, mega, startX, 590, C.fg, C.indigo, 7);
  shadowText(ctx, quizz, startX + wMega + gap, 590, C.amber, C.red, 7);
  ctx.textAlign = 'center';
  ctx.font = `22px ${PIXEL}`;
  ctx.fillStyle = C.teal;
  ctx.fillText('BY NERD DE SEGUNDA', cx, 640);

  // Cartão central
  const cardX = 90;
  const cardY = 700;
  const cardW = STORY_W - 180;
  const cardH = 820;
  ctx.fillStyle = '#000';
  ctx.fillRect(cardX + 14, cardY + 14, cardW, cardH);
  ctx.fillStyle = C.surface;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 6;
  ctx.strokeRect(cardX + 3, cardY + 3, cardW - 6, cardH - 6);

  let y = cardY + 96;
  ctx.fillStyle = C.muted;
  fitText(ctx, d.context.toUpperCase(), cardW - 100, 30, (n) => `600 ${n}px ${DISPLAY}`);
  ctx.fillText(d.context.toUpperCase(), cx, y);

  if (d.duel) {
    y += 90;
    ctx.fillStyle = C.fg;
    fitText(ctx, d.verdict.toUpperCase(), cardW - 100, 62, (n) => `700 ${n}px ${DISPLAY}`);
    ctx.fillText(d.verdict.toUpperCase(), cx, y);
    y += 70;
    const colW = (cardW - 120) / 2;
    d.duel.forEach((p, i) => {
      const bx = cardX + 40 + i * (colW + 40);
      const by = y;
      ctx.fillStyle = C.bg;
      ctx.fillRect(bx, by, colW, 330);
      ctx.strokeStyle = p.winner ? C.amber : C.line;
      ctx.lineWidth = 5;
      ctx.strokeRect(bx + 2.5, by + 2.5, colW - 5, 325);
      ctx.fillStyle = C.fg;
      fitText(ctx, p.name.toUpperCase(), colW - 40, 44, (n) => `700 ${n}px ${DISPLAY}`);
      ctx.fillText(p.name.toUpperCase(), bx + colW / 2, by + 90);
      ctx.font = `64px ${PIXEL}`;
      shadowText(ctx, String(p.score), bx + colW / 2, by + 210, C.amber, C.red, 5);
      ctx.font = `500 28px ${BODY}`;
      ctx.fillStyle = p.winner ? C.teal : C.muted;
      ctx.fillText(p.winner ? 'VENCEDOR' : 'pontos', bx + colW / 2, by + 280);
    });
    y += 400;
  } else {
    y += 110;
    ctx.fillStyle = C.fg;
    fitText(ctx, d.playerName, cardW - 100, 84, (n) => `700 ${n}px ${DISPLAY}`);
    ctx.fillText(d.playerName, cx, y);
    y += 60;
    ctx.fillStyle = C.teal;
    fitText(ctx, d.verdict, cardW - 100, 40, (n) => `600 ${n}px ${DISPLAY}`);
    ctx.fillText(d.verdict, cx, y);
    y += 70;
    ctx.font = `500 28px ${BODY}`;
    ctx.fillStyle = C.muted;
    ctx.fillText(d.bigLabel.toUpperCase(), cx, y);
    y += 170;
    fitText(ctx, d.bigValue, cardW - 120, 150, (n) => `${n}px ${PIXEL}`);
    shadowText(ctx, d.bigValue, cx, y, C.amber, C.red, 10);
    if (d.newRecord) {
      y += 70;
      ctx.font = `24px ${PIXEL}`;
      const label = 'NOVO RECORDE!';
      const w = ctx.measureText(label).width + 40;
      ctx.fillStyle = C.teal;
      ctx.fillRect(cx - w / 2, y - 38, w, 56);
      ctx.fillStyle = C.bg;
      ctx.fillText(label, cx, y);
    }
    y += 70;
  }

  // Estatísticas
  if (d.stats.length) {
    const n = d.stats.length;
    const boxW = (cardW - 80) / n;
    const boxY = cardY + cardH - 190;
    d.stats.forEach((st, i) => {
      const bx = cardX + 40 + i * boxW;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, boxY, boxW, 140);
      ctx.font = `500 24px ${BODY}`;
      ctx.fillStyle = C.muted;
      ctx.fillText(st.label.toUpperCase(), bx + boxW / 2, boxY + 50);
      ctx.font = `36px ${PIXEL}`;
      ctx.fillStyle = C.fg;
      ctx.fillText(st.value, bx + boxW / 2, boxY + 108);
    });
  }

  // Conquistas e chamada para jogar, empilhadas por baixo do cartão
  let by = cardY + cardH + 70;
  if (d.badges.length) {
    ctx.font = `20px ${PIXEL}`;
    ctx.fillStyle = C.amber;
    ctx.fillText('CONQUISTAS DESBLOQUEADAS', cx, by);
    by += 50;
    ctx.fillStyle = C.fg;
    const badges = d.badges.slice(0, 2).join('  ·  ');
    fitText(ctx, badges, STORY_W - 200, 34, (n) => `600 ${n}px ${DISPLAY}`);
    ctx.fillText(badges, cx, by);
    by += 80;
  } else {
    by += 40;
  }
  ctx.fillStyle = C.fg;
  ctx.font = `700 46px ${DISPLAY}`;
  ctx.fillText('Tens nível para me bater?', cx, by);
  by += 50;
  ctx.font = `500 30px ${BODY}`;
  ctx.fillStyle = C.amber;
  ctx.fillText(GAME_URL_SHORT, cx, by);
  by += 42;
  ctx.font = `500 24px ${BODY}`;
  ctx.fillStyle = C.muted;
  ctx.fillText('Nerd de Segunda · Segundas, 20h–22h · Vibe FM 88.3', cx, by);
}

/** Gera a imagem como PNG. */
export async function renderStoryBlob(d: StoryData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await drawStory(canvas, d);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem.'))), 'image/png'),
  );
}
