import { useEffect, useRef } from 'react';
import type { Achievement } from '../types';
import { PixelIcon } from './PixelIcon';

function Toast({ a, onDone }: { a: Achievement; onDone: () => void }) {
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    const t = window.setTimeout(() => doneRef.current(), 4500);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="toast" role="status">
      <PixelIcon name={a.icon} size={32} color="var(--amber)" />
      <div>
        <div className="toast-kicker">Conquista desbloqueada</div>
        <div className="toast-title">{a.name}</div>
      </div>
      <button type="button" className="toast-close" onClick={onDone} aria-label="Fechar aviso">×</button>
    </div>
  );
}

export function AchievementToasts({ items, onDone }: { items: Achievement[]; onDone: (id: string) => void }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.slice(0, 3).map((a) => (
        <Toast key={a.id} a={a} onDone={() => onDone(a.id)} />
      ))}
    </div>
  );
}
