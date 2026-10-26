import { useCallback, useEffect, useState } from 'react';
import type { ProgressState } from '../types';
import type { Screen } from '../App';
import { EPISODES } from '../data/episodes';
import { fetchRanking, rankingEnabled, type RankingResponse } from '../data/leaderboard';
import { completedCount, totalEpisodePoints } from '../game/progress';
import { CONTEST, contestActive } from '../game/config';
import { formatReturn } from '../game/availability';
import { Button, ScreenHeader } from '../components/ui';
import { PixelIcon } from '../components/PixelIcon';
import { RankingSubmit } from '../components/RankingSubmit';

interface Props {
  progress: ProgressState;
  go: (s: Screen) => void;
  update: (fn: (p: ProgressState) => ProgressState) => void;
}

type Load = { status: 'loading' } | { status: 'ready'; data: RankingResponse } | { status: 'error'; message: string };

export function RankingPage({ progress, go, update }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const enabled = rankingEnabled();
  const myPoints = totalEpisodePoints(progress);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoad({ status: 'loading' });
    try {
      setLoad({ status: 'ready', data: await fetchRanking(progress.playerId) });
    } catch (e) {
      setLoad({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' });
    }
  }, [enabled, progress.playerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const me = load.status === 'ready' ? load.data.me : undefined;

  return (
    <section className="ranking">
      <ScreenHeader title="Ranking geral" onBack={() => go({ name: 'home' })} backLabel="Início" />
      <p className="ranking-lede">
        Soma da melhor pontuação de cada um dos {EPISODES.length} episódios do Modo Episódios. Repetir um episódio só conta se bateres o teu recorde nele.
      </p>

      {contestActive() && (
        <div className="contest-banner" role="note">
          <PixelIcon name="trophy" size={28} color="var(--bg)" />
          <p>
            <b>{CONTEST.name}:</b> o #1 do ranking às {formatReturn(CONTEST.until)} ganha {CONTEST.prize.charAt(0).toLowerCase() + CONTEST.prize.slice(1)}. Só conta a versão online.
          </p>
        </div>
      )}

      <div className="panel ranking-me">
        <div className="ranking-me-stats">
          <div><span>Os teus pontos</span><b>{myPoints}</b></div>
          <div><span>Episódios</span><b>{completedCount(progress)}/{EPISODES.length}</b></div>
          <div><span>Posição</span><b>{me ? `#${me.rank}` : '—'}</b></div>
        </div>
        <label className="name-field" htmlFor="ranking-name">
          <span>Nome no ranking (público)</span>
          <input
            id="ranking-name"
            maxLength={20}
            value={progress.settings.playerName}
            onChange={(e) => update((p) => ({ ...p, settings: { ...p.settings, playerName: e.target.value.slice(0, 20) } }))}
            placeholder="Escreve o teu nome"
            autoComplete="nickname"
          />
        </label>
        <RankingSubmit progress={progress} onSent={refresh} inRanking={!!me} />
      </div>

      {!enabled ? (
        <div className="panel panel-muted">
          <p>O ranking geral online está a ser activado. Assim que estiver disponível, vais ver aqui os melhores Nerds de Segunda.</p>
        </div>
      ) : load.status === 'loading' ? (
        <div className="quiz-state" aria-busy="true">
          <div className="loader" aria-hidden="true"><span /><span /><span /><span /></div>
          <p>A carregar o ranking…</p>
        </div>
      ) : load.status === 'error' ? (
        <div className="panel">
          <p className="rank-err">Não foi possível carregar o ranking: {load.message}</p>
          <Button variant="secondary" onClick={refresh}>Tentar outra vez</Button>
        </div>
      ) : load.data.entries.length === 0 ? (
        <div className="panel panel-muted">
          <p>Ainda ninguém entrou no ranking. Conclui um episódio, escreve o teu nome e sê o primeiro!</p>
        </div>
      ) : (
        <div className="panel">
          <div className="ranking-head">
            <h2>Top {load.data.entries.length}</h2>
            <span className="ranking-count">{load.data.total} {load.data.total === 1 ? 'jogador' : 'jogadores'}</span>
            <Button variant="ghost" onClick={refresh}>Actualizar</Button>
          </div>
          <ol className="ranking-list">
            {load.data.entries.map((e) => (
              <li key={`${e.rank}-${e.name}`} className={`${e.me ? 'me' : ''} ${e.rank <= 3 ? `top top-${e.rank}` : ''}`}>
                <span className="r-pos">{e.rank <= 3 ? <PixelIcon name={e.rank === 1 ? 'crown' : 'medal'} size={20} /> : null}#{e.rank}</span>
                <span className="r-name">{e.name}{e.me && <em> (tu)</em>}</span>
                <span className="r-eps">{e.completed}/{EPISODES.length} ep.</span>
                <span className="r-pts">{e.points}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <Button variant="primary" icon="play" onClick={() => go({ name: 'map' })}>Jogar episódios</Button>
    </section>
  );
}
