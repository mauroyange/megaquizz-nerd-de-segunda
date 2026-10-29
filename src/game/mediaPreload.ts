import type { Question } from '../types';
import { RULES } from './config';

/** Endereço público de um ficheiro de public/ (funciona no site, em subpastas e na app). */
export function mediaUrl(src: string): string {
  return `${import.meta.env.BASE_URL ?? './'}${src}`;
}

export function mediaPaths(q: Question): string[] {
  return [q.media?.src, q.media?.reveal, ...(q.optionImages ?? [])].filter((p): p is string => !!p);
}

export function hasMedia(q: Question): boolean {
  return !!q.media || !!q.optionImages;
}

export type MediaLoader = (src: string, kind: 'image' | 'audio') => Promise<boolean>;

/** Carrega uma imagem ou um áudio no navegador; resolve false em caso de erro ou demora. */
export const browserLoader: MediaLoader = (src, kind) =>
  new Promise((resolve) => {
    const url = mediaUrl(src);
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), RULES.mediaLoadTimeoutMs);
    if (kind === 'image') {
      const img = new Image();
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = url;
    } else {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.oncanplaythrough = () => finish(true);
      audio.onerror = () => finish(false);
      audio.src = url;
      audio.load();
    }
  });

/**
 * Garante que a multimédia da sessão carrega. Perguntas cujo ficheiro falha são
 * trocadas por perguntas de texto do mesmo conjunto, de preferência com a mesma
 * dificuldade, sem repetir nenhuma. Devolve as perguntas finais e as que foram trocadas.
 */
export async function ensureMediaLoads(
  chosen: Question[],
  pool: Question[],
  loader: MediaLoader = browserLoader,
): Promise<{ questions: Question[]; dropped: string[] }> {
  const results = await Promise.all(
    chosen.map(async (q) => {
      if (!hasMedia(q)) return true;
      const checks = mediaPaths(q).map((p) => loader(p, q.media?.kind === 'audio' && p === q.media.src ? 'audio' : 'image'));
      return (await Promise.all(checks)).every(Boolean);
    }),
  );
  const used = new Set(chosen.map((q) => q.id));
  const dropped: string[] = [];
  const questions: Question[] = [];
  chosen.forEach((q, i) => {
    if (results[i]) {
      questions.push(q);
      return;
    }
    dropped.push(q.id);
    const spare =
      pool.find((p) => !used.has(p.id) && !hasMedia(p) && p.difficulty === q.difficulty) ??
      pool.find((p) => !used.has(p.id) && !hasMedia(p));
    if (spare) {
      used.add(spare.id);
      questions.push(spare);
    }
  });
  return { questions, dropped };
}
