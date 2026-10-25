import type { ProgressState } from '../types';
import type { Screen } from '../App';
import { Button, NdsLogo, Wordmark } from '../components/ui';
import { completedCount, hasAnyProgress, nextEpisodeId, totalEpisodePoints } from '../game/progress';
import { getEpisode, EPISODES } from '../data/episodes';
import arcade from '../assets/arcade.webp';
import { PixelIcon } from '../components/PixelIcon';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { APK_URL, isNativeApp } from '../utils/platform';

interface Props {
  progress: ProgressState;
  go: (s: Screen) => void;
  update: (fn: (p: ProgressState) => ProgressState) => void;
}

export function HomePage({ progress, go, update }: Props) {
  const resume = hasAnyProgress(progress);
  const nextId = nextEpisodeId(progress);
  const next = getEpisode(nextId);
  const done = completedCount(progress);
  const unlockedAch = Object.keys(progress.achievements).length;
  const { canInstall, install } = useInstallPrompt();
  const native = isNativeApp();

  return (
    <section className="home">
      <div className="home-hero">
        <div className="home-brand">
          <NdsLogo height={88} />
          <div className="home-titles">
            <Wordmark />
            <p className="by-line">by Nerd de Segunda</p>
          </div>
        </div>
        <h1 className="slogan">Tens nível para ser um verdadeiro Nerd?</h1>
        <p className="home-lede">
          10 episódios da Season 5, 150 perguntas e um temporizador sempre a contar.
          Responde rápido, encadeia sequências e desbloqueia o mapa inteiro.
        </p>

        <div className="home-actions">
          <Button variant="primary" icon="play" onClick={() => go({ name: 'modes' })}>Começar a jogar</Button>
          {resume && next && (
            <Button variant="secondary" icon="bolt" onClick={() => go({ name: 'map', focusId: nextId })}>
              Continuar jogo · Ep. #{next.episodeNumber}
            </Button>
          )}
          <Button variant="ghost" icon="question" onClick={() => go({ name: 'how' })}>Como jogar</Button>
          <Button variant="ghost" icon="crown" onClick={() => go({ name: 'ranking' })}>Ranking geral</Button>
          <Button variant="ghost" icon="trophy" onClick={() => go({ name: 'profile' })}>Recordes e conquistas</Button>
        </div>

        {!native && (
          <div className="home-install">
            {canInstall && (
              <Button variant="secondary" icon="star" onClick={install}>Instalar app</Button>
            )}
            <a className="btn btn-ghost" href={APK_URL} target="_blank" rel="noopener">
              <PixelIcon name="robot" size={18} />
              <span>App Android (APK)</span>
            </a>
          </div>
        )}

        {resume && (
          <dl className="home-stats">
            <div><dt>Episódios</dt><dd>{done}/{EPISODES.length}</dd></div>
            <div><dt>Pontos acumulados</dt><dd>{totalEpisodePoints(progress)}</dd></div>
            <div><dt>Conquistas</dt><dd>{unlockedAch}</dd></div>
          </dl>
        )}
      </div>

      <div className="home-art" aria-hidden="true">
        <img src={arcade} alt="" width={300} height={285} />
      </div>

      <footer className="home-footer">
        <span className="onair"><span className="onair-dot" />Nerd de Segunda · Segundas, 20h–22h · Vibe FM 88.3</span>
        <label className="sound-toggle">
          <input
            id="sound-toggle"
            type="checkbox"
            checked={progress.settings.sound}
            onChange={(e) => update((p) => ({ ...p, settings: { ...p.settings, sound: e.target.checked } }))}
          />
          <span>Som</span>
        </label>
      </footer>
    </section>
  );
}
