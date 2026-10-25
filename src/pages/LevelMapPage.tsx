import { useEffect, useRef } from 'react';
import type { ProgressState } from '../types';
import type { PlayConfig, Screen } from '../App';
import { EPISODES } from '../data/episodes';
import { questionCount } from '../data/repository';
import { completedCount, completionPercent, episodeProgress, episodeStatus, totalEpisodePoints } from '../game/progress';
import { DIFFICULTY_LABEL, RULES } from '../game/config';
import { Button, Chip, ProgressBar, ScreenHeader } from '../components/ui';
import { PixelIcon } from '../components/PixelIcon';
import { DifficultyPicker } from '../components/DifficultyPicker';

interface Props {
  progress: ProgressState;
  go: (s: Screen) => void;
  play: (c: PlayConfig) => void;
  update: (fn: (p: ProgressState) => ProgressState) => void;
  focusId?: number;
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

export function LevelMapPage({ progress, go, play, focusId }: Props) {
  const done = completedCount(progress);
  const focusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (focusId && focusRef.current) focusRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [focusId]);

  return (
    <section className="map">
      <ScreenHeader title="Mapa da Season 5" onBack={() => go({ name: 'modes' })} backLabel="Modos" />

      <div className="map-top">
        <div className="map-progress">
          <div className="map-progress-label">
            <span>Progresso global</span>
            <b>{done}/{EPISODES.length} episódios</b>
          </div>
          <ProgressBar value={(done / EPISODES.length) * 100} label="Episódios concluídos" />
          <div className="map-total">
            <div>
              <span>Pontos acumulados</span>
              <b>{totalEpisodePoints(progress)}</b>
            </div>
            <Button variant="ghost" icon="crown" onClick={() => go({ name: 'ranking' })}>Ranking geral</Button>
          </div>
          <p className="map-rule">Acerta {Math.round(RULES.passAccuracy * 100)}% ou mais para concluir um episódio e abrir o seguinte.</p>
        </div>
        <DifficultyPicker />
      </div>

      <ol className="trail">
        {EPISODES.map((ep, i) => {
          const status = episodeStatus(progress, ep.id);
          const ep_p = episodeProgress(progress, ep.id);
          const total = questionCount(ep.id);
          const pct = completionPercent(progress, ep.id, total);
          const locked = status === 'locked';
          const isFocus = ep.id === focusId;
          return (
            <li
              key={ep.id}
              ref={isFocus ? (el) => { focusRef.current = el; } : undefined}
              className={`ep-card status-${status} accent-${ep.accent} ${i % 2 ? 'right' : 'left'} ${isFocus ? 'focus' : ''}`}
            >
              <div className="ep-node" aria-hidden="true">
                {status === 'completed' ? <PixelIcon name="check" size={18} /> : locked ? <PixelIcon name="lock" size={16} /> : <span>{ep.id}</span>}
              </div>
              <article className="ep-body" aria-label={`Nível ${ep.id}: ${ep.title}`}>
                <div className="ep-head">
                  <div className="ep-icon"><PixelIcon name={ep.icon} size={44} color={locked ? 'var(--muted-2)' : `var(--${ep.accent})`} /></div>
                  <div className="ep-titles">
                    <span className="ep-num">Episódio #{ep.episodeNumber}{ep.airDate ? ` · ${formatDate(ep.airDate)}` : ''}</span>
                    <h2>{ep.title}</h2>
                    {ep.subtitle && <p className="ep-sub">{ep.subtitle}</p>}
                  </div>
                </div>
                <p className="ep-desc">{ep.description}</p>
                <div className="ep-chips">
                  {status === 'completed' && <Chip tone="teal" icon="check">Concluído</Chip>}
                  {status === 'unlocked' && <Chip tone="amber" icon="play">Disponível</Chip>}
                  {locked && <Chip tone="muted" icon="lock">Bloqueado</Chip>}
                  {!ep.official && <Chip tone="red">Placeholder</Chip>}
                  <Chip tone="muted">{total} perguntas</Chip>
                  {ep_p.bestDifficulty && <Chip tone="indigo">{DIFFICULTY_LABEL[ep_p.bestDifficulty]}</Chip>}
                </div>
                <dl className="ep-stats">
                  <div><dt>Melhor</dt><dd>{ep_p.bestScore}</dd></div>
                  <div className="ep-pct">
                    <dt>Domínio</dt>
                    <dd>{pct}%</dd>
                    <ProgressBar value={pct} label={`Percentagem de perguntas dominadas no episódio ${ep.id}`} tone={ep.accent} />
                  </div>
                </dl>
                <Button
                  variant={status === 'unlocked' ? 'primary' : 'secondary'}
                  icon={locked ? 'lock' : 'play'}
                  disabled={locked}
                  onClick={() => play({ mode: 'episode', episodeId: ep.id })}
                  aria-label={locked ? `Nível ${ep.id} bloqueado: conclui o episódio anterior` : `Jogar episódio ${ep.episodeNumber}`}
                >
                  {locked ? `Conclui o Ep. #${ep.episodeNumber - 1}` : status === 'completed' ? 'Repetir' : 'Jogar'}
                </Button>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
