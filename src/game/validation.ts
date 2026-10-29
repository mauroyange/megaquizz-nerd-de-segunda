import { OPTION_IDS, type Question } from '../types';
import { RULES } from './config';

export interface ValidationIssue {
  questionId: string;
  problem: string;
}

const DIFFICULTIES = ['casual', 'nerd', 'lenda'];

/** Verifica uma pergunta: campos obrigatórios, 4 opções distintas e uma resposta correcta válida. */
export function validateQuestion(q: Question): string[] {
  const problems: string[] = [];
  if (!q || typeof q !== 'object') return ['pergunta inválida'];
  if (!q.id?.trim()) problems.push('sem id');
  if (!Number.isInteger(q.episodeId)) problems.push('episodeId inválido');
  if (!q.category?.trim()) problems.push('sem categoria');
  if (!DIFFICULTIES.includes(q.difficulty)) problems.push('dificuldade inválida');
  if (!q.question?.trim()) problems.push('sem texto da pergunta');
  if (!q.explanation?.trim()) problems.push('sem explicação');
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    problems.push('precisa de exactamente 4 opções');
  } else {
    if (q.options.some((o) => typeof o !== 'string' || !o.trim())) problems.push('opção vazia');
    const normalised = new Set(q.options.map((o) => String(o).trim().toLowerCase()));
    if (normalised.size !== 4) problems.push('opções repetidas');
  }
  if (!OPTION_IDS.includes(q.correctOptionId)) problems.push('correctOptionId inválido');
  if (q.media) {
    const m = q.media;
    if (m.kind !== 'image' && m.kind !== 'audio') problems.push('media.kind inválido');
    if (!m.src?.trim() || /^https?:|^\//.test(m.src)) problems.push('media.src deve ser um caminho relativo a public/');
    if (!m.alt?.trim()) problems.push('media sem descrição (alt)');
    if (m.kind === 'audio') {
      if (!m.clipSeconds || m.clipSeconds <= 0) problems.push('áudio sem clipSeconds');
      else if (m.clipSeconds > RULES.maxClipSeconds) problems.push(`excerto de áudio com mais de ${RULES.maxClipSeconds}s`);
      if (!m.credit?.trim()) problems.push('áudio sem crédito/fonte');
    }
  }
  if (q.optionImages) {
    if (!Array.isArray(q.optionImages) || q.optionImages.length !== 4 || q.optionImages.some((p) => !p?.trim())) {
      problems.push('optionImages precisa de 4 imagens');
    }
  }
  return problems;
}

/** Valida um conjunto e devolve as perguntas válidas + os problemas encontrados (incluindo ids duplicados). */
export function validateBank(questions: Question[]): { valid: Question[]; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const valid: Question[] = [];
  for (const q of questions) {
    const problems = validateQuestion(q);
    if (q?.id && seen.has(q.id)) problems.push('id duplicado');
    if (problems.length) {
      issues.push(...problems.map((problem) => ({ questionId: q?.id ?? '?', problem })));
      continue;
    }
    seen.add(q.id);
    valid.push(q);
  }
  return { valid, issues };
}
