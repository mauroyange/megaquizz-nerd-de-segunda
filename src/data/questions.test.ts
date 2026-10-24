import { describe, expect, it } from 'vitest';
import { QUESTION_BANK } from './questions';
import { EPISODES } from './episodes';
import { validateBank } from '../game/validation';
import { RULES } from '../game/config';

describe('banco de perguntas', () => {
  it('todas as perguntas passam a validação', () => {
    const { issues } = validateBank(QUESTION_BANK);
    expect(issues).toEqual([]);
  });

  it('cada episódio tem entre 10 e 15 perguntas, com as três dificuldades', () => {
    for (const ep of EPISODES) {
      const list = QUESTION_BANK.filter((q) => q.episodeId === ep.id);
      expect(list.length, `episódio ${ep.id}`).toBeGreaterThanOrEqual(10);
      expect(list.length, `episódio ${ep.id}`).toBeLessThanOrEqual(15);
      for (const d of ['casual', 'nerd', 'lenda'] as const) {
        expect(list.filter((q) => q.difficulty === d).length, `ep ${ep.id} ${d}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('os ids seguem o formato epXX_qNNN e correspondem ao episódio', () => {
    for (const q of QUESTION_BANK) {
      expect(q.id).toMatch(/^ep\d{2}_q\d{3}$/);
      expect(Number(q.id.slice(2, 4))).toBe(q.episodeId);
    }
  });

  it('os temporizadores dos episódios ficam entre 20 e 30 s', () => {
    for (const ep of EPISODES) {
      expect(ep.timerSeconds).toBeGreaterThanOrEqual(RULES.timerMin);
      expect(ep.timerSeconds).toBeLessThanOrEqual(RULES.timerMax);
    }
  });
});
