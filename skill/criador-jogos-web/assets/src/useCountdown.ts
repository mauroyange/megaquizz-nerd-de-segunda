import { useEffect, useRef, useState } from 'react';

/**
 * Temporizador com pausa. Mede o tempo com performance.now() (sem desvios),
 * acumula o tempo decorrido entre pausas e dispara `onExpire` uma única vez
 * por pergunta. Mudar `resetKey` recomeça a contagem.
 */
export function useCountdown(totalMs: number, running: boolean, resetKey: string, onExpire: () => void) {
  const [remaining, setRemaining] = useState(totalMs);
  const accRef = useRef(0);
  const startRef = useRef(0);
  const runningRef = useRef(false);
  const firedRef = useRef(false);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    accRef.current = 0;
    firedRef.current = false;
    setRemaining(totalMs);
  }, [resetKey, totalMs]);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    runningRef.current = true;
    let raf = 0;
    const tick = () => {
      const left = Math.max(0, totalMs - (accRef.current + performance.now() - startRef.current));
      setRemaining(left);
      if (left <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          expireRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      accRef.current += performance.now() - startRef.current;
      runningRef.current = false;
    };
  }, [running, resetKey, totalMs]);

  /** Tempo decorrido nesta pergunta, em ms (sem contar pausas). */
  const elapsed = () =>
    Math.min(totalMs, accRef.current + (runningRef.current ? performance.now() - startRef.current : 0));
  return { remaining, elapsed };
}
