import type { Achievement, ProgressState, SessionSummary } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';

/**
 * Avalia as conquistas depois de uma sessão. Devolve o progresso com as
 * novas conquistas marcadas e a lista das que foram desbloqueadas agora.
 */
export function evaluateAchievements(
  progress: ProgressState,
  summary: SessionSummary,
  now = Date.now(),
  list: Achievement[] = ACHIEVEMENTS,
): { progress: ProgressState; unlocked: Achievement[] } {
  const unlocked = list.filter((a) => !progress.achievements[a.id] && a.check({ summary, progress }));
  if (!unlocked.length) return { progress, unlocked };
  const achievements = { ...progress.achievements };
  for (const a of unlocked) achievements[a.id] = now;
  return { progress: { ...progress, achievements }, unlocked };
}
