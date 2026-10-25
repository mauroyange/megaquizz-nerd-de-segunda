import type { Difficulty, OptionId, Question } from '../../types';

/**
 * Atalho para escrever perguntas de forma compacta.
 * As alternativas são baralhadas durante o jogo, por isso a ordem aqui não importa.
 */
export function q(
  episodeId: number,
  n: number,
  difficulty: Difficulty,
  category: string,
  question: string,
  options: [string, string, string, string],
  correctOptionId: OptionId,
  explanation: string,
  source: string | null = null,
): Question {
  return {
    id: `ep${String(episodeId).padStart(2, '0')}_q${String(n).padStart(3, '0')}`,
    episodeId,
    category,
    difficulty,
    question,
    options,
    correctOptionId,
    explanation,
    source,
  };
}

export const SRC_DECK = 'Apresentação do Projecto — Nerd de Segunda (2026)';
export const roteiro = (ep: number) => `Roteiro oficial Nerd de Segunda S5E${ep}`;
