import { createContext, useContext } from 'react';
import type { Difficulty } from '../types';
import { DIFFICULTY_HINT, DIFFICULTY_LABEL } from '../game/config';

interface Ctx {
  value: Difficulty;
  set: (d: Difficulty) => void;
}

export const DifficultyContext = createContext<Ctx | null>(null);

const OPTIONS: Difficulty[] = ['casual', 'nerd', 'lenda'];

/** Selector de dificuldade partilhado (guardado nas definições do jogador). */
export function DifficultyPicker() {
  const ctx = useContext(DifficultyContext);
  if (!ctx) return null;
  return (
    <fieldset className="difficulty">
      <legend>Dificuldade</legend>
      <div className="seg">
        {OPTIONS.map((d) => (
          <label key={d} className={`seg-opt ${ctx.value === d ? 'on' : ''} seg-${d}`}>
            <input type="radio" name="difficulty" id={`diff-${d}`} value={d} checked={ctx.value === d} onChange={() => ctx.set(d)} />
            <span>{DIFFICULTY_LABEL[d]}</span>
          </label>
        ))}
      </div>
      <p className="seg-hint">{DIFFICULTY_HINT[ctx.value]}</p>
    </fieldset>
  );
}
