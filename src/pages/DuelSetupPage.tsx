import { useState, type FormEvent } from 'react';
import type { PlayConfig, Screen } from '../App';
import { Button, ScreenHeader } from '../components/ui';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { RULES } from '../game/config';

export function DuelSetupPage({ go, play }: { go: (s: Screen) => void; play: (c: PlayConfig) => void }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const a = p1.trim() || 'Jogador 1';
    let b = p2.trim() || 'Jogador 2';
    if (a.toLowerCase() === b.toLowerCase()) b = `${b} (2)`;
    play({ mode: 'duelo', playerNames: [a, b] });
  };

  return (
    <section className="duel-setup">
      <ScreenHeader title="Duelo Nerd" onBack={() => go({ name: 'modes' })} backLabel="Modos" />
      <form className="panel duel-form" onSubmit={submit}>
        <p>
          Dois jogadores, um dispositivo. Respondem à vez a {RULES.questionsPerSession.duelo} perguntas de todos os temas
          ({RULES.questionsPerSession.duelo / 2} cada). Ganha quem tiver mais pontos.
        </p>
        <div className="duel-inputs">
          <label htmlFor="duel-p1">
            Jogador 1
            <input id="duel-p1" maxLength={16} value={p1} onChange={(e) => setP1(e.target.value)} placeholder="Jogador 1" autoComplete="off" />
          </label>
          <span className="vs" aria-hidden="true">VS</span>
          <label htmlFor="duel-p2">
            Jogador 2
            <input id="duel-p2" maxLength={16} value={p2} onChange={(e) => setP2(e.target.value)} placeholder="Jogador 2" autoComplete="off" />
          </label>
        </div>
        <DifficultyPicker />
        <Button variant="primary" icon="swords" type="submit">Começar duelo</Button>
        <p className="soon-note">O duelo online está em preparação e ainda não está disponível.</p>
      </form>
    </section>
  );
}
