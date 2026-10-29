import { describe, expect, it } from 'vitest';
import { activePause, isModeAvailable, MODE_PAUSES } from './availability';
import { applySession, createInitialProgress, sanitizeProgress, totalEpisodePoints } from './progress';
import { buildSubmission } from '../data/leaderboard';

const t = (iso: string) => Date.parse(iso);

describe('pausa temporária dos modos', () => {
  it('o Modo Episódios nunca é pausado', () => {
    expect(MODE_PAUSES.episode).toBeUndefined();
    expect(isModeAvailable('episode', t('2026-10-26T12:00:00+01:00'))).toBe(true);
  });
  it('Relâmpago, Sobrevivência e Duelo ficam inactivos durante os 4 dias', () => {
    for (const m of ['relampago', 'sobrevivencia', 'duelo'] as const) {
      expect(isModeAvailable(m, t('2026-10-25T15:00:00+01:00'))).toBe(false);
      expect(isModeAvailable(m, t('2026-10-29T13:59:00+01:00'))).toBe(false);
    }
  });
  it('voltam automaticamente ao normal depois do prazo', () => {
    for (const m of ['relampago', 'sobrevivencia', 'duelo'] as const) {
      expect(isModeAvailable(m, t('2026-10-29T14:00:00+01:00'))).toBe(true);
      expect(activePause(m, t('2026-11-15T10:00:00+01:00'))).toBeNull();
    }
  });
  it('a pausa dura 4 dias ou menos', () => {
    for (const p of Object.values(MODE_PAUSES)) {
      expect(Date.parse(p!.until) - Date.parse(p!.from)).toBeLessThanOrEqual(4.6 * 24 * 3600 * 1000);
    }
  });
});

const ep = (episodeId: number, score: number, passed = true) => ({
  mode: 'episode' as const, episodeId, difficulty: 'nerd' as const, score, correct: 8, wrong: 2, total: 10, accuracy: 0.8,
  timeMs: 50000, avgTimeMs: 5000, maxStreak: 4, passed, completionBonus: 0, correctIds: [], players: [], eliminated: false,
});

describe('pontos acumulados e ranking', () => {
  it('soma a melhor pontuação de cada episódio (repetir não acumula)', () => {
    let p = createInitialProgress();
    p = applySession(p, ep(1, 900));
    p = applySession(p, ep(1, 500));
    p = applySession(p, ep(2, 1200));
    expect(totalEpisodePoints(p)).toBe(2100);
  });
  it('outros modos não contam para os pontos acumulados', () => {
    const p = applySession(createInitialProgress(), { ...ep(1, 999), mode: 'relampago', episodeId: null });
    expect(totalEpisodePoints(p)).toBe(0);
  });
  it('envia só o nome, o id anónimo e as pontuações dos episódios', () => {
    let p = createInitialProgress();
    p = applySession(p, ep(3, 700));
    p = { ...p, settings: { ...p.settings, playerName: '  Mauro Yange  ' } };
    const body = buildSubmission(p);
    expect(Object.keys(body).sort()).toEqual(['episodes', 'id', 'name']);
    expect(body.name).toBe('Mauro Yange');
    expect(body.episodes[3]).toEqual({ best: 700, completed: true });
    expect(body.episodes[1]).toEqual({ best: 0, completed: false });
    expect(body.id.length).toBeGreaterThanOrEqual(16);
  });
  it('mantém o id anónimo entre sessões e cria um para dados antigos', () => {
    const p = createInitialProgress();
    expect(sanitizeProgress(JSON.parse(JSON.stringify(p))).playerId).toBe(p.playerId);
    const old = { ...JSON.parse(JSON.stringify(p)), playerId: undefined };
    expect(sanitizeProgress(old).playerId.length).toBeGreaterThanOrEqual(16);
  });
});

import { contestActive } from './config';
import { submitBlockedHere } from '../data/leaderboard';

describe('passatempo (só versão online)', () => {
  it('está activo até 27/10 às 22h00 de Luanda', () => {
    expect(contestActive(t('2026-10-27T21:59:00+01:00'))).toBe(true);
    expect(contestActive(t('2026-10-27T22:00:00+01:00'))).toBe(false);
  });
  it('a app Android não envia durante o passatempo; o site envia sempre', () => {
    const during = t('2026-10-27T12:00:00+01:00');
    expect(submitBlockedHere(during, true)).toBe(true);
    expect(submitBlockedHere(during, false)).toBe(false);
    expect(submitBlockedHere(t('2026-10-28T12:00:00+01:00'), true)).toBe(false);
  });
});

import { timerForQuestion } from './scoring';
import { createSession, sessionReducer } from './session';
import { validateQuestion } from './validation';

describe('perguntas com som', () => {
  const audioQ = {
    id: 'ep01_q099', episodeId: 1, category: 'Teste', difficulty: 'casual' as const, question: 'Som?',
    options: ['A', 'B', 'C', 'D'] as [string, string, string, string], correctOptionId: 'a' as const, explanation: 'x', source: null,
    media: { kind: 'audio' as const, src: 'media/audio/x.mp3', alt: 'Excerto', clipSeconds: 8, credit: 'Fonte' },
  };
  it('dão 10 segundos extra', () => {
    expect(timerForQuestion(25, audioQ)).toBe(35);
    expect(timerForQuestion(25, { media: undefined })).toBe(25);
  });
  it('o fim do tempo conta o tempo total da pergunta com som', () => {
    let s = createSession({ mode: 'episode', questions: [audioQ], difficulty: 'casual', timerSeconds: 25, now: 0 });
    s = sessionReducer(s, { type: 'timeout' });
    expect(s.answers[audioQ.id].timeMs).toBe(35000);
  });
  it('rejeita excertos longos, sem crédito ou com endereços externos', () => {
    expect(validateQuestion({ ...audioQ, media: { ...audioQ.media, clipSeconds: 30 } })).toContain('excerto de áudio com mais de 10s');
    expect(validateQuestion({ ...audioQ, media: { ...audioQ.media, credit: '' } })).toContain('áudio sem crédito/fonte');
    expect(validateQuestion({ ...audioQ, media: { ...audioQ.media, src: 'https://x.com/a.mp3' } })).toContain('media.src deve ser um caminho relativo a public/');
    expect(validateQuestion(audioQ)).toEqual([]);
  });
});

import { ensureMediaLoads } from './mediaPreload';
import type { Question } from '../types';

describe('pré-carregamento de imagens e sons', () => {
  const mk = (id: string, extra: Partial<Question> = {}): Question => ({
    id, episodeId: 1, category: 'T', difficulty: 'casual', question: id, options: ['a1', 'b1', 'c1', 'd1'],
    correctOptionId: 'a', explanation: 'x', source: null, ...extra,
  });
  const img = mk('m1', { media: { kind: 'image', src: 'media/img/x.webp', alt: 'x' } });
  const txt = [mk('t1'), mk('t2'), mk('t3', { difficulty: 'nerd' })];

  it('mantém as perguntas quando a multimédia carrega', async () => {
    const r = await ensureMediaLoads([img, txt[0]], [img, ...txt], async () => true);
    expect(r.questions.map((q) => q.id)).toEqual(['m1', 't1']);
    expect(r.dropped).toEqual([]);
  });
  it('troca por uma pergunta de texto da mesma dificuldade, sem repetir, quando falha', async () => {
    const r = await ensureMediaLoads([img, txt[0]], [img, ...txt], async () => false);
    expect(r.dropped).toEqual(['m1']);
    expect(r.questions.map((q) => q.id)).toEqual(['t2', 't1']);
  });
});
