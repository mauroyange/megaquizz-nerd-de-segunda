import { describe, expect, it } from 'vitest';
import type { Question } from '../types';
import { SCORING, RULES } from './config';
import { answerPoints, effectiveTimer, speedBonus, streakBonusFor } from './scoring';
import { createSession, sessionReducer, summarize, currentQuestion } from './session';
import { applySession, createInitialProgress, episodeStatus, isUnlocked, completionPercent, nextEpisodeId, sanitizeProgress } from './progress';
import { evaluateAchievements } from './achievements';
import { pickEpisodeQuestions, pickMixedQuestions, pickSurvivalQuestions } from './questionPicker';
import { validateQuestion, validateBank } from './validation';
import { seededRng } from '../utils/random';
import { QUESTION_BANK } from '../data/questions';

function makeQ(id: string, extra: Partial<Question> = {}): Question {
  return {
    id,
    episodeId: 1,
    category: 'Teste',
    difficulty: 'casual',
    question: `Pergunta ${id}?`,
    options: ['Certa', 'Errada 1', 'Errada 2', 'Errada 3'],
    correctOptionId: 'a',
    explanation: 'Porque sim.',
    source: null,
    ...extra,
  };
}

const qs = (n: number) => Array.from({ length: n }, (_, i) => makeQ(`t${i}`));

describe('pontuação', () => {
  it('dá 100 + bónus de rapidez máximo numa resposta instantânea', () => {
    expect(answerPoints(true, 0, 25, 'casual')).toBe(SCORING.correct + SCORING.maxSpeedBonus);
  });
  it('dá 0 a uma resposta errada', () => {
    expect(answerPoints(false, 1000, 25, 'casual')).toBe(0);
  });
  it('reduz o bónus de rapidez de forma linear', () => {
    expect(speedBonus(12500, 25)).toBe(25);
    expect(speedBonus(25000, 25)).toBe(0);
    expect(speedBonus(99999, 25)).toBe(0);
  });
  it('aplica o multiplicador de dificuldade', () => {
    expect(answerPoints(true, 25000, 25, 'lenda')).toBe(150);
    expect(answerPoints(true, 25000, 25, 'nerd')).toBe(125);
  });
  it('dá bónus de sequência a cada 3 correctas', () => {
    expect(streakBonusFor(2)).toBe(0);
    expect(streakBonusFor(3)).toBe(SCORING.streakBonus);
    expect(streakBonusFor(6)).toBe(SCORING.streakBonus);
  });
  it('mantém o temporizador entre 20 e 30 segundos', () => {
    expect(effectiveTimer(25, 'casual')).toBe(30);
    expect(effectiveTimer(25, 'lenda')).toBe(20);
    expect(effectiveTimer(30, 'casual')).toBe(RULES.timerMax);
    expect(effectiveTimer(20, 'lenda')).toBe(RULES.timerMin);
  });
});

describe('sessão', () => {
  const start = (n = 10, mode: 'episode' | 'relampago' | 'sobrevivencia' | 'duelo' = 'episode') =>
    createSession({ mode, questions: qs(n), difficulty: 'casual', timerSeconds: 25, episodeId: 1, now: 0, rng: seededRng(1), playerNames: mode === 'duelo' ? ['A', 'B'] : undefined });

  it('conta uma resposta correcta e uma incorrecta', () => {
    let s = start();
    s = sessionReducer(s, { type: 'answer', optionId: 'a', timeMs: 25000 });
    expect(s.players[0].score).toBe(100);
    expect(s.phase).toBe('feedback');
    s = sessionReducer(s, { type: 'next', now: 1 });
    s = sessionReducer(s, { type: 'answer', optionId: 'b', timeMs: 1000 });
    expect(s.players[0].score).toBe(100);
    expect(s.players[0].wrong).toBe(1);
  });

  it('não conta a mesma pergunta duas vezes', () => {
    let s = start();
    s = sessionReducer(s, { type: 'answer', optionId: 'a', timeMs: 25000 });
    const again = sessionReducer(s, { type: 'answer', optionId: 'a', timeMs: 25000 });
    const afterTimeout = sessionReducer(s, { type: 'timeout' });
    expect(again).toBe(s);
    expect(afterTimeout).toBe(s);
    expect(Object.keys(s.answers)).toHaveLength(1);
  });

  it('trata o fim do tempo como resposta falhada', () => {
    let s = start();
    s = sessionReducer(s, { type: 'timeout' });
    const rec = s.answers[currentQuestion(s)!.id];
    expect(rec.correct).toBe(false);
    expect(rec.selected).toBeNull();
    expect(rec.timeMs).toBe(25000);
    expect(s.players[0].score).toBe(0);
    expect(s.phase).toBe('feedback');
  });

  it('dá o bónus de sequência à terceira correcta seguida', () => {
    let s = start();
    for (let i = 0; i < 3; i++) {
      s = sessionReducer(s, { type: 'answer', optionId: 'a', timeMs: 25000 });
      s = sessionReducer(s, { type: 'next', now: 1 });
    }
    expect(s.players[0].score).toBe(300 + SCORING.streakBonus);
  });

  it('termina um nível e dá a recompensa de conclusão quando passa', () => {
    let s = start(10);
    for (let i = 0; i < 10; i++) {
      s = sessionReducer(s, { type: 'answer', optionId: i < 7 ? 'a' : 'b', timeMs: 25000 });
      s = sessionReducer(s, { type: 'next', now: 100 });
    }
    expect(s.phase).toBe('finished');
    const sum = summarize(s);
    expect(sum.correct).toBe(7);
    expect(sum.passed).toBe(true);
    expect(sum.completionBonus).toBe(SCORING.levelCompletionBonus);
    // 7×100 + 2 bónus de sequência (3.ª e 6.ª) + conclusão
    expect(sum.score).toBe(700 + 2 * SCORING.streakBonus + SCORING.levelCompletionBonus);
  });

  it('não dá recompensa de conclusão abaixo da precisão mínima', () => {
    let s = start(10);
    for (let i = 0; i < 10; i++) {
      s = sessionReducer(s, { type: 'answer', optionId: i < 5 ? 'a' : 'b', timeMs: 25000 });
      s = sessionReducer(s, { type: 'next', now: 100 });
    }
    expect(summarize(s).passed).toBe(false);
    expect(summarize(s).completionBonus).toBe(0);
  });

  it('Sobrevivência termina ao primeiro erro', () => {
    let s = start(20, 'sobrevivencia');
    s = sessionReducer(s, { type: 'answer', optionId: 'a', timeMs: 1000 });
    s = sessionReducer(s, { type: 'next', now: 1 });
    s = sessionReducer(s, { type: 'timeout' });
    s = sessionReducer(s, { type: 'next', now: 2 });
    expect(s.phase).toBe('finished');
    expect(s.eliminated).toBe(true);
    expect(summarize(s).correct).toBe(1);
  });

  it('Duelo alterna os jogadores e pontua cada um', () => {
    let s = start(4, 'duelo');
    s = sessionReducer(s, { type: 'answer', optionId: 'a', timeMs: 25000 });
    s = sessionReducer(s, { type: 'next', now: 1 });
    expect(s.currentPlayer).toBe(1);
    s = sessionReducer(s, { type: 'answer', optionId: 'b', timeMs: 25000 });
    s = sessionReducer(s, { type: 'next', now: 1 });
    expect(s.currentPlayer).toBe(0);
    expect(s.players[0].score).toBe(100);
    expect(s.players[1].score).toBe(0);
  });

  it('baralha as alternativas sem perder nenhuma', () => {
    const s = start();
    for (const order of Object.values(s.optionOrder)) expect([...order].sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('progressão', () => {
  const passSummary = (episodeId: number, passed = true) => ({
    mode: 'episode' as const, episodeId, difficulty: 'nerd' as const, score: 900, correct: passed ? 8 : 3, wrong: passed ? 2 : 7, total: 10,
    accuracy: passed ? 0.8 : 0.3, timeMs: 50000, avgTimeMs: 5000, maxStreak: 4, passed, completionBonus: 0,
    correctIds: ['ep01_q001', 'ep01_q002'], players: [], eliminated: false,
  });

  it('começa só com o nível 1 desbloqueado', () => {
    const p = createInitialProgress();
    expect(isUnlocked(p, 1)).toBe(true);
    expect(isUnlocked(p, 2)).toBe(false);
    expect(episodeStatus(p, 2)).toBe('locked');
  });

  it('desbloqueia o nível seguinte quando o anterior é concluído', () => {
    const p = applySession(createInitialProgress(), passSummary(1));
    expect(episodeStatus(p, 1)).toBe('completed');
    expect(isUnlocked(p, 2)).toBe(true);
    expect(isUnlocked(p, 3)).toBe(false);
    expect(nextEpisodeId(p)).toBe(2);
  });

  it('não desbloqueia se o jogador não passar', () => {
    const p = applySession(createInitialProgress(), passSummary(1, false));
    expect(isUnlocked(p, 2)).toBe(false);
    expect(p.episodes[1].plays).toBe(1);
  });

  it('guarda a melhor pontuação e não a perde ao repetir', () => {
    let p = applySession(createInitialProgress(), passSummary(1));
    p = applySession(p, { ...passSummary(1), score: 300 });
    expect(p.episodes[1].bestScore).toBe(900);
    expect(p.episodes[1].completed).toBe(true);
    expect(p.episodes[1].plays).toBe(2);
  });

  it('calcula a percentagem de conclusão sem duplicados', () => {
    let p = applySession(createInitialProgress(), passSummary(1));
    p = applySession(p, passSummary(1));
    expect(completionPercent(p, 1, 15)).toBe(13); // 2 de 15
  });

  it('sobrevive a dados corrompidos no armazenamento', () => {
    expect(sanitizeProgress('lixo').version).toBe(1);
    expect(sanitizeProgress({ version: 99 }).episodes).toEqual({});
    const repaired = sanitizeProgress({ version: 1, stats: { sessions: 3 } });
    expect(repaired.stats.sessions).toBe(3);
    expect(repaired.stats.totalCorrect).toBe(0);
  });

  it('desbloqueia conquistas apenas uma vez', () => {
    const summary = { ...passSummary(1), maxStreak: 10 };
    const p1 = applySession(createInitialProgress(), summary);
    const r1 = evaluateAchievements(p1, summary, 1);
    expect(r1.unlocked.map((a) => a.id)).toEqual(expect.arrayContaining(['primeiro-contacto', 'mente-enciclopedia']));
    const r2 = evaluateAchievements(r1.progress, summary, 2);
    expect(r2.unlocked).toHaveLength(0);
  });
});

describe('selecção de perguntas', () => {
  const ep1 = QUESTION_BANK.filter((q) => q.episodeId === 1);

  it('não repete perguntas numa sessão de episódio', () => {
    for (const d of ['casual', 'nerd', 'lenda'] as const) {
      const picked = pickEpisodeQuestions(ep1, d, 10, seededRng(7));
      expect(picked).toHaveLength(10);
      expect(new Set(picked.map((q) => q.id)).size).toBe(10);
    }
  });

  it('Casual não inclui perguntas Lenda e Lenda não inclui Casual', () => {
    expect(pickEpisodeQuestions(ep1, 'casual', 10, seededRng(3)).some((q) => q.difficulty === 'lenda')).toBe(false);
    expect(pickEpisodeQuestions(ep1, 'lenda', 10, seededRng(3)).some((q) => q.difficulty === 'casual')).toBe(false);
  });

  it('completa a sessão mesmo com poucas perguntas de uma dificuldade', () => {
    const small = [...qs(3), ...qs(9).map((q, i) => ({ ...q, id: `n${i}`, difficulty: 'nerd' as const }))];
    const picked = pickEpisodeQuestions(small, 'lenda', 10, seededRng(1));
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((q) => q.id)).size).toBe(10);
  });

  it('o Desafio Relâmpago mistura vários episódios', () => {
    const picked = pickMixedQuestions(QUESTION_BANK, 10, seededRng(5));
    expect(new Set(picked.map((q) => q.id)).size).toBe(10);
    expect(new Set(picked.map((q) => q.episodeId)).size).toBe(10);
  });

  it('a Sobrevivência usa todas as perguntas, das fáceis para as difíceis', () => {
    const picked = pickSurvivalQuestions(QUESTION_BANK, seededRng(2));
    expect(picked).toHaveLength(QUESTION_BANK.length);
    expect(picked[0].difficulty).toBe('casual');
    expect(picked[picked.length - 1].difficulty).toBe('lenda');
  });
});

describe('validação', () => {
  it('aceita uma pergunta correcta', () => {
    expect(validateQuestion(makeQ('ok'))).toEqual([]);
  });
  it('rejeita opções repetidas, resposta inválida e campos vazios', () => {
    expect(validateQuestion(makeQ('x', { options: ['A', 'a', 'B', 'C'] }))).toContain('opções repetidas');
    expect(validateQuestion(makeQ('x', { correctOptionId: 'e' as never }))).toContain('correctOptionId inválido');
    expect(validateQuestion(makeQ('x', { explanation: '' }))).toContain('sem explicação');
    expect(validateQuestion(makeQ('x', { options: ['A', 'B', 'C'] as never }))).toContain('precisa de exactamente 4 opções');
  });
  it('detecta ids duplicados', () => {
    const { valid, issues } = validateBank([makeQ('dup'), makeQ('dup')]);
    expect(valid).toHaveLength(1);
    expect(issues[0].problem).toBe('id duplicado');
  });
});
