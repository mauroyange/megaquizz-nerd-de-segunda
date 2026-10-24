import type { Question } from '../types';
import { QUESTION_BANK } from './questions';
import { validateBank, type ValidationIssue } from '../game/validation';

/**
 * Ponto único de acesso às perguntas. Hoje lê o banco local; no futuro pode
 * ir buscar perguntas a uma API sem mudar os ecrãs (a interface já é assíncrona).
 */
export interface QuestionRepository {
  getAll(): Promise<{ questions: Question[]; issues: ValidationIssue[] }>;
  getByEpisode(episodeId: number): Promise<{ questions: Question[]; issues: ValidationIssue[] }>;
}

export const localRepository: QuestionRepository = {
  async getAll() {
    const { valid, issues } = validateBank(QUESTION_BANK);
    return { questions: valid, issues };
  },
  async getByEpisode(episodeId) {
    const { valid, issues } = validateBank(QUESTION_BANK.filter((q) => q.episodeId === episodeId));
    return { questions: valid, issues };
  },
};

/** Contagem síncrona usada no mapa de níveis. */
export function questionCount(episodeId: number): number {
  return QUESTION_BANK.filter((q) => q.episodeId === episodeId).length;
}

/**
 * Preparado para rankings online numa fase futura. Ainda não existe
 * implementação remota, e a interface não apresenta rankings online como activos.
 */
export interface LeaderboardService {
  submitScore(entry: { mode: string; score: number; name: string }): Promise<void>;
  top(mode: string, limit: number): Promise<Array<{ name: string; score: number }>>;
}
