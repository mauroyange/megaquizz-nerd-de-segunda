import type { GameMode } from '../types';

/**
 * Períodos em que um modo fica inactivo. Nada é apagado: fora destas datas o
 * modo volta automaticamente ao normal. Para prolongar ou cancelar, edita as datas.
 */
export interface ModePause {
  from: string; // ISO 8601 com fuso horário
  until: string;
  reason: string;
}

export const MODE_PAUSES: Partial<Record<GameMode, ModePause>> = {
  relampago: { from: '2026-10-25T00:00:00+01:00', until: '2026-10-29T14:00:00+01:00', reason: 'Semana do Modo Episódios e do Ranking Geral' },
  sobrevivencia: { from: '2026-10-25T00:00:00+01:00', until: '2026-10-29T14:00:00+01:00', reason: 'Semana do Modo Episódios e do Ranking Geral' },
  duelo: { from: '2026-10-25T00:00:00+01:00', until: '2026-10-29T14:00:00+01:00', reason: 'Semana do Modo Episódios e do Ranking Geral' },
};

export function activePause(mode: GameMode, now = Date.now()): ModePause | null {
  const p = MODE_PAUSES[mode];
  if (!p) return null;
  return now >= Date.parse(p.from) && now < Date.parse(p.until) ? p : null;
}

export function isModeAvailable(mode: GameMode, now = Date.now()): boolean {
  return activePause(mode, now) === null;
}

/** Ex.: "29/10 às 14h00" (hora de Luanda). */
export function formatReturn(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', timeZone: 'Africa/Luanda' });
  const time = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda' }).replace(':', 'h');
  return `${date} às ${time}`;
}
