import type { Difficulty, GameMode, Question } from '../types';
import { RULES } from './config';
import { shuffle, type Rng } from '../utils/random';

const ORDER: Difficulty[] = ['casual', 'nerd', 'lenda'];

/**
 * Escolhe as perguntas de uma sessão de episódio segundo a mistura de dificuldades.
 * Se faltarem perguntas de um nível, completa com as restantes (sem repetir).
 */
export function pickEpisodeQuestions(pool: Question[], difficulty: Difficulty, count: number, rng?: Rng): Question[] {
  const mix = RULES.episodeMix[difficulty];
  const chosen: Question[] = [];
  const used = new Set<string>();
  for (const d of ORDER) {
    const want = mix[d];
    if (!want) continue;
    for (const q of shuffle(pool.filter((p) => p.difficulty === d), rng).slice(0, want)) {
      chosen.push(q);
      used.add(q.id);
    }
  }
  if (chosen.length < count) {
    // Preferir dificuldades próximas da escolhida.
    const prefer = difficulty === 'lenda' ? ['lenda', 'nerd', 'casual'] : difficulty === 'casual' ? ['casual', 'nerd', 'lenda'] : ['nerd', 'casual', 'lenda'];
    const rest = shuffle(pool.filter((p) => !used.has(p.id)), rng).sort(
      (a, b) => prefer.indexOf(a.difficulty) - prefer.indexOf(b.difficulty),
    );
    chosen.push(...rest.slice(0, count - chosen.length));
  }
  // Ordem crescente de dificuldade dá uma curva mais agradável.
  return shuffle(chosen.slice(0, count), rng).sort((a, b) => ORDER.indexOf(a.difficulty) - ORDER.indexOf(b.difficulty));
}

/** Perguntas aleatórias de vários temas, sem repetir, tentando variar os episódios. */
export function pickMixedQuestions(pool: Question[], count: number, rng?: Rng): Question[] {
  const byEpisode = new Map<number, Question[]>();
  for (const q of shuffle(pool, rng)) {
    const list = byEpisode.get(q.episodeId) ?? [];
    list.push(q);
    byEpisode.set(q.episodeId, list);
  }
  const queues = shuffle([...byEpisode.values()], rng);
  const out: Question[] = [];
  while (out.length < count && queues.some((l) => l.length)) {
    for (const list of queues) {
      const next = list.shift();
      if (next) out.push(next);
      if (out.length >= count) break;
    }
  }
  return out;
}

/** Sobrevivência: todas as perguntas, das mais fáceis para as mais difíceis. */
export function pickSurvivalQuestions(pool: Question[], rng?: Rng): Question[] {
  return ORDER.flatMap((d) => pickMixedQuestions(pool.filter((q) => q.difficulty === d), Infinity, rng));
}

export function pickQuestionsForMode(
  mode: GameMode,
  pool: Question[],
  difficulty: Difficulty,
  rng?: Rng,
): Question[] {
  const count = RULES.questionsPerSession[mode];
  switch (mode) {
    case 'episode':
      return pickEpisodeQuestions(pool, difficulty, count, rng);
    case 'sobrevivencia':
      return pickSurvivalQuestions(pool, rng);
    case 'relampago':
    case 'duelo':
      return pickMixedQuestions(pool, count, rng);
  }
}
