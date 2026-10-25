import type { ProgressState } from '../types';
import { EPISODES } from './episodes';
import { ONLINE } from '../game/config';
import { episodeProgress } from '../game/progress';

export interface RankingEntry {
  rank: number;
  name: string;
  points: number;
  completed: number;
  me: boolean;
}

export interface RankingResponse {
  ok: boolean;
  total: number;
  updatedAt?: string;
  entries: RankingEntry[];
  me?: { rank: number; points: number; completed: number };
  error?: string;
}

export interface SubmitResponse {
  ok: boolean;
  rank?: number;
  points?: number;
  completed?: number;
  total?: number;
  error?: string;
}

export function rankingEnabled(): boolean {
  return !!ONLINE.rankingUrl;
}

/** Dados enviados para o ranking: só o nome escolhido, o id anónimo e as pontuações dos episódios. */
export function buildSubmission(p: ProgressState) {
  const episodes: Record<number, { best: number; completed: boolean }> = {};
  for (const e of EPISODES) {
    const ep = episodeProgress(p, e.id);
    episodes[e.id] = { best: ep.bestScore, completed: ep.completed };
  }
  return { id: p.playerId, name: p.settings.playerName.trim().slice(0, 20), episodes };
}

async function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error('O servidor demorou demasiado a responder.')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(t!);
  }
}

export async function fetchRanking(playerId: string, limit = 100): Promise<RankingResponse> {
  if (!rankingEnabled()) throw new Error('O ranking online ainda não está activo.');
  const url = `${ONLINE.rankingUrl}?limit=${limit}&id=${encodeURIComponent(playerId)}`;
  const res = await withTimeout(fetch(url, { method: 'GET', redirect: 'follow' }));
  if (!res.ok) throw new Error(`Erro do servidor (${res.status}).`);
  const data = (await res.json()) as RankingResponse;
  if (!data.ok) throw new Error(data.error ?? 'Resposta inválida do servidor.');
  return data;
}

export async function submitScore(p: ProgressState): Promise<SubmitResponse> {
  if (!rankingEnabled()) throw new Error('O ranking online ainda não está activo.');
  const body = buildSubmission(p);
  if (!body.name) throw new Error('Escreve o teu nome para entrares no ranking.');
  // text/plain evita o pedido prévio de CORS, que o Apps Script não suporta.
  const res = await withTimeout(
    fetch(ONLINE.rankingUrl, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }),
  );
  if (!res.ok) throw new Error(`Erro do servidor (${res.status}).`);
  const data = (await res.json()) as SubmitResponse;
  if (!data.ok) throw new Error(data.error ?? 'Não foi possível enviar a pontuação.');
  return data;
}
