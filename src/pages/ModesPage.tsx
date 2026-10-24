import type { ProgressState, IconName } from '../types';
import type { PlayConfig, Screen } from '../App';
import { Button, ScreenHeader } from '../components/ui';
import { PixelIcon } from '../components/PixelIcon';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { completedCount } from '../game/progress';
import { EPISODES } from '../data/episodes';
import { RULES } from '../game/config';

interface Props {
  progress: ProgressState;
  go: (s: Screen) => void;
  play: (c: PlayConfig) => void;
}

interface ModeCard {
  id: string;
  title: string;
  icon: IconName;
  tone: string;
  body: string;
  stat: string;
  action: () => void;
  cta: string;
}

export function ModesPage({ progress, go, play }: Props) {
  const modes: ModeCard[] = [
    {
      id: 'episode',
      title: 'Modo Episódios',
      icon: 'radio',
      tone: 'amber',
      body: `Percorre os 10 episódios da Season 5. Acerta pelo menos ${Math.round(RULES.passAccuracy * 100)}% para desbloquear o seguinte.`,
      stat: `${completedCount(progress)}/${EPISODES.length} concluídos`,
      action: () => go({ name: 'map' }),
      cta: 'Abrir mapa',
    },
    {
      id: 'relampago',
      title: 'Desafio Relâmpago',
      icon: 'bolt',
      tone: 'teal',
      body: '10 perguntas aleatórias de todos os temas. Uma ronda rápida para bater o teu recorde.',
      stat: `Recorde: ${progress.records.relampago} pts`,
      action: () => play({ mode: 'relampago' }),
      cta: 'Jogar',
    },
    {
      id: 'sobrevivencia',
      title: 'Modo Sobrevivência',
      icon: 'heart',
      tone: 'red',
      body: 'Perguntas seguidas, cada vez mais difíceis. Um erro ou o tempo a acabar e é game over.',
      stat: `Recorde: ${progress.records.sobrevivencia} certas`,
      action: () => play({ mode: 'sobrevivencia' }),
      cta: 'Jogar',
    },
    {
      id: 'duelo',
      title: 'Duelo Nerd',
      icon: 'swords',
      tone: 'indigo',
      body: `Dois jogadores no mesmo dispositivo, à vez: ${RULES.questionsPerSession.duelo / 2} perguntas para cada um.`,
      stat: `Duelos jogados: ${progress.records.dueloPlayed}`,
      action: () => go({ name: 'duelSetup' }),
      cta: 'Preparar duelo',
    },
  ];

  return (
    <section className="modes">
      <ScreenHeader title="Escolhe o modo" onBack={() => go({ name: 'home' })} backLabel="Início" />
      <DifficultyPicker />
      <div className="mode-grid">
        {modes.map((m) => (
          <article key={m.id} className={`mode-card tone-border-${m.tone}`}>
            <div className="mode-icon"><PixelIcon name={m.icon} size={40} color={`var(--${m.tone})`} /></div>
            <h2>{m.title}</h2>
            <p>{m.body}</p>
            <p className="mode-stat">{m.stat}</p>
            <Button variant={m.id === 'episode' ? 'primary' : 'secondary'} onClick={m.action}>{m.cta}</Button>
          </article>
        ))}
      </div>
      <p className="soon-note">Duelo online e rankings globais estão em preparação. Nesta versão, tudo fica guardado só neste dispositivo.</p>
    </section>
  );
}
