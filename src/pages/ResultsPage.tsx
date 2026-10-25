import { useState } from 'react';
import type { ProgressState } from '../types';
import { ShareDialog } from '../components/ShareDialog';
import type { StoryData } from '../share/storyImage';
import type { PlayConfig, ResultData, Screen } from '../App';
import { getEpisode, EPISODES } from '../data/episodes';
import { isUnlocked } from '../game/progress';
import { DIFFICULTY_LABEL, MODE_LABEL, RULES } from '../game/config';
import { Button, ScreenHeader } from '../components/ui';
import { PixelIcon } from '../components/PixelIcon';

interface Props {
  data: ResultData;
  progress: ProgressState;
  go: (s: Screen) => void;
  play: (c: PlayConfig) => void;
  update: (fn: (p: ProgressState) => ProgressState) => void;
}

export function formatTime(ms: number) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
}

export function ResultsPage({ data, progress, go, play, update }: Props) {
  const [sharing, setSharing] = useState(false);
  const playerName = progress.settings.playerName;
  const setPlayerName = (name: string) =>
    update((p) => ({ ...p, settings: { ...p.settings, playerName: name.slice(0, 20) } }));
  const { summary, config, session, unlocked, newRecord, previousBest } = data;
  const episode = config.episodeId ? getEpisode(config.episodeId) : undefined;
  const nextEp = episode ? EPISODES.find((e) => e.id === episode.id + 1) : undefined;
  const canNext = config.mode === 'episode' && nextEp && isUnlocked(progress, nextEp.id);
  const isDuel = config.mode === 'duelo';
  const isSurvival = config.mode === 'sobrevivencia';

  let verdict: string;
  if (isDuel) {
    const [a, b] = summary.players;
    verdict = a.score === b.score ? 'Empate técnico!' : `${a.score > b.score ? a.name : b.name} vence o duelo!`;
  } else if (config.mode === 'episode') {
    verdict = summary.passed ? 'Episódio concluído!' : 'Quase lá…';
  } else if (isSurvival) {
    verdict = summary.eliminated ? 'Game over' : 'Sobreviveste a tudo!';
  } else {
    verdict = 'Desafio terminado!';
  }

  const contextLine = `${episode ? `Ep. #${episode.episodeNumber} · ${episode.title}` : MODE_LABEL[config.mode]} · ${DIFFICULTY_LABEL[summary.difficulty]}`;
  const story: StoryData = {
    playerName: playerName.trim() || 'Nerd anónimo',
    context: contextLine,
    verdict,
    bigValue: String(isSurvival ? summary.correct : summary.score),
    bigLabel: isSurvival ? 'Certas seguidas' : 'Pontos',
    stats: isDuel
      ? [
          { label: 'Certas', value: summary.players.map((p) => p.correct).join(' × ') },
          { label: 'Sequência', value: summary.players.map((p) => p.maxStreak).join(' × ') },
          { label: 'Perguntas', value: String(summary.total) },
        ]
      : [
          { label: 'Certas', value: `${summary.correct}/${summary.total}` },
          { label: 'Precisão', value: `${Math.round(summary.accuracy * 100)}%` },
          { label: 'Sequência', value: String(summary.maxStreak) },
        ],
    badges: unlocked.map((a) => a.name),
    newRecord,
    duel: isDuel
      ? summary.players.map((p) => ({ name: p.name, score: p.score, winner: p.score === Math.max(...summary.players.map((x) => x.score)) }))
      : undefined,
  };
  const shareText = isDuel
    ? `${verdict} Duelo Nerd no MegaQuizz by Nerd de Segunda.`
    : isSurvival
      ? `Sobrevivi a ${summary.correct} perguntas seguidas no MegaQuizz by Nerd de Segunda! Tens nível para me bater?`
      : `Fiz ${summary.score} pontos no MegaQuizz by Nerd de Segunda (${contextLine})! Tens nível para me bater?`;

  const backTarget: Screen = config.mode === 'episode' ? { name: 'map', focusId: config.episodeId } : { name: 'modes' };

  return (
    <section className="results">
      <ScreenHeader title="Resultados" onBack={() => go(backTarget)} backLabel={config.mode === 'episode' ? 'Mapa' : 'Modos'} />

      <div className={`result-hero ${summary.passed ? 'pass' : 'fail'}`}>
        <PixelIcon name={isDuel ? 'swords' : summary.passed && !summary.eliminated ? 'trophy' : 'skull'} size={64} color={summary.passed && !summary.eliminated ? 'var(--amber)' : 'var(--red)'} />
        <div>
          <p className="result-kicker">
            {episode ? `Ep. #${episode.episodeNumber} · ${episode.title}` : MODE_LABEL[config.mode]} · {DIFFICULTY_LABEL[summary.difficulty]}
          </p>
          <h2 className="verdict">{verdict}</h2>
          {config.mode === 'episode' && !summary.passed && (
            <p className="result-note">Precisas de {Math.round(RULES.passAccuracy * 100)}% de acertos para desbloquear o próximo episódio.</p>
          )}
        </div>
      </div>

      {isDuel ? (
        <div className="duel-board">
          {summary.players.map((p, i) => (
            <div key={i} className={`duel-player ${p.score >= Math.max(...summary.players.map((x) => x.score)) ? 'winner' : ''}`}>
              <span className="duel-name">{p.name}</span>
              <span className="duel-score">{p.score}</span>
              <span className="duel-line">{p.correct} certas · {p.wrong} erradas · melhor sequência {p.maxStreak}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="score-big">
          <span className="score-label">{isSurvival ? 'Certas seguidas' : 'Pontuação'}</span>
          <span className="score-value">{isSurvival ? summary.correct : summary.score}</span>
          {newRecord && <span className="record-badge">Novo recorde!</span>}
          {!newRecord && previousBest > 0 && <span className="record-prev">Melhor: {previousBest}</span>}
        </div>
      )}

      <div className="share-box">
        {!isDuel && (
          <label className="name-field" htmlFor="player-name">
            <span>O teu nome no resultado</span>
            <input
              id="player-name"
              maxLength={20}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Escreve o teu nome"
              autoComplete="nickname"
            />
          </label>
        )}
        <div className="share-cta">
          <Button variant="primary" icon="star" onClick={() => setSharing(true)}>Partilhar resultado</Button>
          <p>Gera uma imagem para os stories ou para enviar a um amigo.</p>
        </div>
      </div>

      {!isDuel && (
        <dl className="result-stats">
          <div><dt>Certas</dt><dd className="ok">{summary.correct}</dd></div>
          <div><dt>Erradas</dt><dd className="ko">{summary.wrong}</dd></div>
          <div><dt>Precisão</dt><dd>{Math.round(summary.accuracy * 100)}%</dd></div>
          <div><dt>Tempo total</dt><dd>{formatTime(summary.timeMs)}</dd></div>
          <div><dt>Melhor sequência</dt><dd>{summary.maxStreak}</dd></div>
          {isSurvival ? <div><dt>Pontos</dt><dd>{summary.score}</dd></div> : <div><dt>Média/resposta</dt><dd>{(summary.avgTimeMs / 1000).toFixed(1)}s</dd></div>}
        </dl>
      )}

      {(summary.completionBonus > 0 || unlocked.length > 0) && (
        <div className="rewards">
          <h3>Recompensas</h3>
          <ul>
            {summary.completionBonus > 0 && (
              <li><PixelIcon name="star" size={24} color="var(--amber)" /> Bónus de conclusão: +{summary.completionBonus} pts</li>
            )}
            {unlocked.map((a) => (
              <li key={a.id}><PixelIcon name={a.icon} size={24} color="var(--amber)" /> <b>{a.name}</b> — {a.description}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-actions">
        <Button variant="primary" icon="play" onClick={() => play(config)}>{isDuel ? 'Desforra' : 'Jogar novamente'}</Button>
        {canNext && nextEp && (
          <Button variant="secondary" icon="bolt" onClick={() => play({ mode: 'episode', episodeId: nextEp.id })}>
            Próximo nível · Ep. #{nextEp.episodeNumber}
          </Button>
        )}
        <Button variant="ghost" onClick={() => go(backTarget)}>{config.mode === 'episode' ? 'Voltar ao mapa' : 'Voltar aos modos'}</Button>
      </div>

      <ShareDialog open={sharing} story={story} text={shareText} onClose={() => setSharing(false)} />

      <details className="review">
        <summary>Rever respostas ({Object.keys(session.answers).length})</summary>
        <ol>
          {session.questions.filter((q) => session.answers[q.id]).map((q) => {
            const a = session.answers[q.id];
            const idx = (id: string) => ['a', 'b', 'c', 'd'].indexOf(id);
            return (
              <li key={q.id} className={a.correct ? 'ok' : 'ko'}>
                <p className="rv-q">{q.question}</p>
                <p className="rv-a">
                  {a.correct ? '✔' : '✘'} {a.selected ? q.options[idx(a.selected)] : 'Sem resposta (tempo esgotado)'}
                  {!a.correct && <> · Certa: <b>{q.options[idx(q.correctOptionId)]}</b></>}
                  {isDuel && <> · {summary.players[a.player]?.name}</>}
                </p>
              </li>
            );
          })}
        </ol>
      </details>
    </section>
  );
}
