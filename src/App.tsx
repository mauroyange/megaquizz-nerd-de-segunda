import { useCallback, useEffect, useState } from 'react';
import type { Achievement, GameMode, SessionState, SessionSummary } from './types';
import { useProgress } from './hooks/useProgress';
import { applySession, episodeProgress } from './game/progress';
import { evaluateAchievements } from './game/achievements';
import { summarize } from './game/session';
import { HomePage } from './pages/HomePage';
import { ModesPage } from './pages/ModesPage';
import { LevelMapPage } from './pages/LevelMapPage';
import { QuizPage } from './pages/QuizPage';
import { ResultsPage } from './pages/ResultsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { DuelSetupPage } from './pages/DuelSetupPage';
import { PixelCorners } from './components/ui';
import { AchievementToasts } from './components/AchievementToasts';
import { DifficultyContext } from './components/DifficultyPicker';
import { sfx } from './utils/sound';

export interface PlayConfig {
  mode: GameMode;
  episodeId?: number;
  playerNames?: string[];
}

export interface ResultData {
  config: PlayConfig;
  summary: SessionSummary;
  session: SessionState;
  unlocked: Achievement[];
  previousBest: number;
  newRecord: boolean;
}

export type Screen =
  | { name: 'home' }
  | { name: 'modes' }
  | { name: 'map'; focusId?: number }
  | { name: 'how' }
  | { name: 'profile' }
  | { name: 'duelSetup' }
  | { name: 'play'; config: PlayConfig; runId: number }
  | { name: 'results'; data: ResultData };

export default function App() {
  const { progress, update, reset, canSave } = useProgress();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [toasts, setToasts] = useState<Achievement[]>([]);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  }, []);

  const play = useCallback((config: PlayConfig) => go({ name: 'play', config, runId: Date.now() }), [go]);

  // Move o foco para o título de cada ecrã novo (navegação por teclado / leitores de ecrã).
  useEffect(() => {
    const h = document.querySelector<HTMLElement>('main h1, main h2');
    h?.setAttribute('tabindex', '-1');
    h?.focus({ preventScroll: true });
  }, [screen.name]);

  const finish = useCallback(
    (config: PlayConfig, session: SessionState) => {
      const summary = summarize(session);
      const previousBest =
        config.mode === 'episode' && config.episodeId
          ? episodeProgress(progress, config.episodeId).bestScore
          : config.mode === 'relampago'
            ? progress.records.relampago
            : config.mode === 'sobrevivencia'
              ? progress.records.sobrevivencia
              : 0;
      const compareValue = config.mode === 'sobrevivencia' ? summary.correct : summary.score;
      const afterSession = applySession(progress, summary);
      const { progress: withAchievements, unlocked } = evaluateAchievements(afterSession, summary);
      update(() => withAchievements);
      if (unlocked.length) {
        setToasts((t) => [...t, ...unlocked]);
        sfx.unlock();
      }
      go({
        name: 'results',
        data: {
          config,
          summary,
          session,
          unlocked,
          previousBest,
          newRecord: config.mode !== 'duelo' && compareValue > previousBest && compareValue > 0,
        },
      });
    },
    [progress, update, go],
  );

  let page: JSX.Element;
  switch (screen.name) {
    case 'home':
      page = <HomePage progress={progress} go={go} update={update} />;
      break;
    case 'modes':
      page = <ModesPage progress={progress} go={go} play={play} />;
      break;
    case 'map':
      page = <LevelMapPage progress={progress} go={go} play={play} update={update} focusId={screen.focusId} />;
      break;
    case 'how':
      page = <HowToPlayPage go={go} />;
      break;
    case 'profile':
      page = <ProfilePage progress={progress} go={go} reset={reset} canSave={canSave} />;
      break;
    case 'duelSetup':
      page = <DuelSetupPage go={go} play={play} />;
      break;
    case 'play':
      page = (
        <QuizPage
          key={screen.runId}
          config={screen.config}
          difficulty={progress.settings.difficulty}
          onFinish={(s) => finish(screen.config, s)}
          onQuit={() => go(screen.config.mode === 'episode' ? { name: 'map', focusId: screen.config.episodeId } : { name: 'modes' })}
        />
      );
      break;
    case 'results':
      page = <ResultsPage data={screen.data} progress={progress} go={go} play={play} update={update} />;
      break;
  }

  return (
    <div className={`app screen-${screen.name}`}>
      <PixelCorners />
      <DifficultyContext.Provider
        value={{
          value: progress.settings.difficulty,
          set: (d) => update((p) => ({ ...p, settings: { ...p.settings, difficulty: d } })),
        }}
      >
        <main className="app-main">{page}</main>
      </DifficultyContext.Provider>
      <AchievementToasts items={toasts} onDone={(id) => setToasts((t) => t.filter((a) => a.id !== id))} />
    </div>
  );
}
