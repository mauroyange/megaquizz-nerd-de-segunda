import type { Difficulty, EpisodeProgress, ProgressState, SessionSummary } from '../types';
import { EPISODES } from '../data/episodes';

const DIFF_RANK: Record<Difficulty, number> = { casual: 0, nerd: 1, lenda: 2 };

export function emptyEpisodeProgress(): EpisodeProgress {
  return { completed: false, bestScore: 0, bestAccuracy: 0, bestDifficulty: null, plays: 0, masteredIds: [], bestTimeMs: null };
}

/** Gera um identificador anónimo (não contém dados pessoais). */
export function newPlayerId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* continua para a alternativa */
  }
  return 'p-' + Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('-');
}

export function createInitialProgress(): ProgressState {
  return {
    version: 1,
    episodes: {},
    records: { relampago: 0, sobrevivencia: 0, dueloPlayed: 0 },
    achievements: {},
    stats: { sessions: 0, totalAnswered: 0, totalCorrect: 0, bestStreak: 0, totalTimeMs: 0 },
    settings: { difficulty: 'casual', sound: true, playerName: '' },
    lastEpisodeId: null,
    playerId: newPlayerId(),
  };
}

export function episodeProgress(p: ProgressState, id: number): EpisodeProgress {
  return p.episodes[id] ?? emptyEpisodeProgress();
}

export type EpisodeStatus = 'locked' | 'unlocked' | 'completed';

/** O nível 1 começa desbloqueado; os seguintes abrem quando o anterior é concluído. */
export function isUnlocked(p: ProgressState, id: number): boolean {
  const idx = EPISODES.findIndex((e) => e.id === id);
  if (idx <= 0) return idx === 0;
  return episodeProgress(p, EPISODES[idx - 1].id).completed;
}

export function episodeStatus(p: ProgressState, id: number): EpisodeStatus {
  if (episodeProgress(p, id).completed) return 'completed';
  return isUnlocked(p, id) ? 'unlocked' : 'locked';
}

/** Percentagem de conclusão: perguntas distintas já acertadas / total do episódio. */
export function completionPercent(p: ProgressState, id: number, totalQuestions: number): number {
  if (!totalQuestions) return 0;
  return Math.round((episodeProgress(p, id).masteredIds.length / totalQuestions) * 100);
}

export function completedCount(p: ProgressState): number {
  return EPISODES.filter((e) => episodeProgress(p, e.id).completed).length;
}

/** Próximo episódio a jogar: o primeiro desbloqueado e por concluir, ou o último jogado. */
export function nextEpisodeId(p: ProgressState): number {
  const open = EPISODES.find((e) => isUnlocked(p, e.id) && !episodeProgress(p, e.id).completed);
  return open?.id ?? p.lastEpisodeId ?? EPISODES[0].id;
}

/** Pontos acumulados no Modo Episódios: soma da melhor pontuação de cada episódio. */
export function totalEpisodePoints(p: ProgressState): number {
  return EPISODES.reduce((sum, e) => sum + episodeProgress(p, e.id).bestScore, 0);
}

export function hasAnyProgress(p: ProgressState): boolean {
  return p.stats.sessions > 0;
}

/** Aplica o resultado de uma sessão ao progresso (função pura). */
export function applySession(p: ProgressState, s: SessionSummary): ProgressState {
  const next: ProgressState = {
    ...p,
    episodes: { ...p.episodes },
    records: { ...p.records },
    stats: {
      sessions: p.stats.sessions + 1,
      totalAnswered: p.stats.totalAnswered + s.total,
      totalCorrect: p.stats.totalCorrect + s.correct,
      bestStreak: Math.max(p.stats.bestStreak, s.maxStreak),
      totalTimeMs: p.stats.totalTimeMs + s.timeMs,
    },
  };

  if (s.mode === 'episode' && s.episodeId != null) {
    const prev = episodeProgress(p, s.episodeId);
    const isBetterDiff = !prev.bestDifficulty || DIFF_RANK[s.difficulty] > DIFF_RANK[prev.bestDifficulty];
    next.episodes[s.episodeId] = {
      completed: prev.completed || s.passed,
      bestScore: Math.max(prev.bestScore, s.score),
      bestAccuracy: Math.max(prev.bestAccuracy, s.accuracy),
      bestDifficulty: s.passed && isBetterDiff ? s.difficulty : prev.bestDifficulty,
      plays: prev.plays + 1,
      masteredIds: Array.from(new Set([...prev.masteredIds, ...s.correctIds])),
      bestTimeMs: s.passed ? Math.min(prev.bestTimeMs ?? Infinity, s.timeMs) : prev.bestTimeMs,
    };
    next.lastEpisodeId = s.episodeId;
  }
  if (s.mode === 'relampago') next.records.relampago = Math.max(p.records.relampago, s.score);
  if (s.mode === 'sobrevivencia') next.records.sobrevivencia = Math.max(p.records.sobrevivencia, s.correct);
  if (s.mode === 'duelo') next.records.dueloPlayed = p.records.dueloPlayed + 1;
  return next;
}

/** Repara dados antigos ou corrompidos lidos do armazenamento. */
export function sanitizeProgress(raw: unknown): ProgressState {
  const base = createInitialProgress();
  if (!raw || typeof raw !== 'object' || (raw as ProgressState).version !== 1) return base;
  const r = raw as Partial<ProgressState>;
  return {
    ...base,
    ...r,
    episodes: { ...(r.episodes ?? {}) },
    records: { ...base.records, ...(r.records ?? {}) },
    achievements: { ...(r.achievements ?? {}) },
    stats: { ...base.stats, ...(r.stats ?? {}) },
    settings: { ...base.settings, ...(r.settings ?? {}) },
    playerId: typeof r.playerId === 'string' && r.playerId.length >= 16 ? r.playerId : base.playerId,
    version: 1,
  };
}
