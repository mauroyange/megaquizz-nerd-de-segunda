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

  it('cada episódio tem entre 10 e 15 perguntas de texto (mais até 5 com multimédia), com as três dificuldades', () => {
    for (const ep of EPISODES) {
      const all = QUESTION_BANK.filter((q) => q.episodeId === ep.id);
      const list = all.filter((q) => !q.media && !q.optionImages);
      expect(all.length - list.length, `episódio ${ep.id} multimédia`).toBeLessThanOrEqual(5);
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

import fs from 'node:fs';
import path from 'node:path';

describe('perguntas com imagem e som', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/media/manifest.json'), 'utf8')) as {
    files: Record<string, { kind: string; seconds?: number; bytes: number }>;
  };
  const media = QUESTION_BANK.filter((q) => q.media || q.optionImages);

  it('todos os ficheiros referidos existem em public/ e estão no manifesto', () => {
    for (const q of media) {
      const paths = [q.media?.src, q.media?.reveal, ...(q.optionImages ?? [])].filter(Boolean) as string[];
      for (const p of paths) {
        expect(fs.existsSync(path.resolve(__dirname, '../../public', p)), `${q.id}: ${p}`).toBe(true);
        expect(manifest.files[p], `${q.id}: ${p} no manifesto`).toBeDefined();
      }
    }
  });

  it('nenhum excerto de áudio passa do limite e a duração declarada bate com o ficheiro', () => {
    for (const q of media.filter((m) => m.media?.kind === 'audio')) {
      const info = manifest.files[q.media!.src];
      expect(info.seconds!, q.id).toBeLessThanOrEqual(10.3);
      expect(Math.abs((q.media!.clipSeconds ?? 0) - info.seconds!), q.id).toBeLessThan(0.6);
    }
  });

  it('as imagens são leves (menos de 150 KB cada)', () => {
    for (const [p, info] of Object.entries(manifest.files)) {
      if (info.kind === 'image') expect(info.bytes, p).toBeLessThan(150 * 1024);
    }
  });
});
