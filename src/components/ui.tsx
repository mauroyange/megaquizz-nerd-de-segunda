import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useEffect, useRef } from 'react';
import logoVertical from '../assets/logo-vertical.svg';
import logoHorizontal from '../assets/logo-horizontal.svg';
import { PixelIcon } from './PixelIcon';
import type { IconName } from '../types';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: IconName;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = 'secondary', icon, block, className = '', children, ...rest },
  ref,
) {
  return (
    <button ref={ref} type="button" className={`btn btn-${variant} ${block ? 'btn-block' : ''} ${className}`} {...rest}>
      {icon && <PixelIcon name={icon} size={18} />}
      <span>{children}</span>
    </button>
  );
});

/** Logótipo oficial do Nerd de Segunda (extraído do ficheiro .ai da produção). */
export function NdsLogo({ variant = 'vertical', height = 96 }: { variant?: 'vertical' | 'horizontal'; height?: number }) {
  return (
    <img
      src={variant === 'vertical' ? logoVertical : logoHorizontal}
      alt="Nerd de Segunda"
      height={height}
      style={{ height, width: 'auto' }}
      className="nds-logo"
    />
  );
}

export function Wordmark({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  return (
    <div className={`wordmark wordmark-${size}`}>
      <span className="wm-mega">MEGA</span>
      <span className="wm-quizz">QUIZZ</span>
    </div>
  );
}

export function ScreenHeader({ title, onBack, backLabel = 'Voltar', right }: { title: string; onBack?: () => void; backLabel?: string; right?: ReactNode }) {
  return (
    <header className="screen-header">
      {onBack ? (
        <button type="button" className="back-btn" onClick={onBack}>
          <span aria-hidden="true">◀</span> {backLabel}
        </button>
      ) : <span />}
      <h1 className="screen-title">{title}</h1>
      <div className="screen-header-right">{right}</div>
    </header>
  );
}

export function ProgressBar({ value, label, tone = 'amber' }: { value: number; label: string; tone?: 'amber' | 'teal' | 'red' | 'indigo' }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="pbar" role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`pbar-fill tone-${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Caixa de confirmação dentro da página (o visualizador não mostra window.confirm). */
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel }: {
  open: boolean; title: string; body: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-body" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-body">{body}</p>
        <div className="modal-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel}><span>Cancelar</span></button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}><span>{confirmLabel}</span></button>
        </div>
      </div>
    </div>
  );
}

/** Quadrados de pixel nos cantos, inspirados no fundo oficial do programa. */
const CORNER_PIXELS: Array<[number, number, string]> = [
  [0, 0, 'teal'], [1, 0, 'amber'], [0, 1, 'red'], [2, 0, 'indigo'], [0, 2, 'amber'], [1, 1, 'indigo'],
  [3, 0, 'teal'], [0, 3, 'teal'], [2, 1, 'red'], [1, 2, 'teal'], [4, 0, 'red'], [0, 4, 'indigo'],
];
export function PixelCorners() {
  return (
    <div className="pixel-corners" aria-hidden="true">
      {(['tl', 'br'] as const).map((corner) => (
        <div key={corner} className={`pc pc-${corner}`}>
          {CORNER_PIXELS.map(([x, y, c], i) => (
            <span key={i} className={`px tone-${c}`} style={{ ['--x' as string]: x, ['--y' as string]: y }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Chip({ tone, children, icon }: { tone: 'teal' | 'red' | 'indigo' | 'amber' | 'muted'; children: ReactNode; icon?: IconName }) {
  return (
    <span className={`chip chip-${tone}`}>
      {icon && <PixelIcon name={icon} size={12} />}
      {children}
    </span>
  );
}
