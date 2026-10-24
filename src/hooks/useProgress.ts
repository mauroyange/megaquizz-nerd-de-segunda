import { useCallback, useEffect, useState } from 'react';
import type { ProgressState } from '../types';
import { loadProgress, saveProgress, clearProgress } from '../utils/storage';
import { createInitialProgress } from '../game/progress';
import { setSoundEnabled } from '../utils/sound';

/** Estado de progresso persistido em localStorage. */
export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());
  const [canSave, setCanSave] = useState(true);

  useEffect(() => {
    setCanSave(saveProgress(progress));
    setSoundEnabled(progress.settings.sound);
  }, [progress]);

  const update = useCallback((fn: (p: ProgressState) => ProgressState) => setProgress((p) => fn(p)), []);

  const reset = useCallback(() => {
    clearProgress();
    setProgress((p) => ({ ...createInitialProgress(), settings: p.settings }));
  }, []);

  return { progress, update, reset, canSave };
}
