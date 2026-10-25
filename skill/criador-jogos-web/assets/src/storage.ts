import type { ProgressState } from '../types';
import { createInitialProgress, sanitizeProgress } from '../game/progress';

const KEY = 'megaquizz-nds:progress:v1';

/** Lê o progresso guardado. Se o armazenamento estiver bloqueado ou corrompido, começa do zero. */
export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitizeProgress(JSON.parse(raw)) : createInitialProgress();
  } catch {
    return createInitialProgress();
  }
}

/** Guarda o progresso. Devolve false se o browser não permitir guardar. */
export function saveProgress(p: ProgressState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* sem armazenamento disponível */
  }
}
