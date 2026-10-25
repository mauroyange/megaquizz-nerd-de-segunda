import type { Difficulty } from '../types';
import { RULES, SCORING } from './config';

/** Bónus de rapidez: proporcional ao tempo que sobrou (0 a maxSpeedBonus). */
export function speedBonus(timeMs: number, timerSeconds: number): number {
  const total = timerSeconds * 1000;
  if (total <= 0) return 0;
  const remaining = Math.max(0, Math.min(1, (total - timeMs) / total));
  return Math.round(SCORING.maxSpeedBonus * remaining);
}

/** Pontos de uma resposta (sem bónus de sequência). */
export function answerPoints(correct: boolean, timeMs: number, timerSeconds: number, difficulty: Difficulty): number {
  if (!correct) return SCORING.wrong;
  const raw = SCORING.correct + speedBonus(timeMs, timerSeconds);
  return Math.round(raw * SCORING.difficultyMultiplier[difficulty]);
}

/** Bónus atribuído quando a sequência atinge um múltiplo de streakEvery. */
export function streakBonusFor(streak: number): number {
  return streak > 0 && streak % SCORING.streakEvery === 0 ? SCORING.streakBonus : 0;
}

/** Temporizador efectivo, limitado ao intervalo configurado (20–30 s). */
export function effectiveTimer(baseSeconds: number, difficulty: Difficulty): number {
  const t = baseSeconds + RULES.timerOffset[difficulty];
  return Math.max(RULES.timerMin, Math.min(RULES.timerMax, t));
}
