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
