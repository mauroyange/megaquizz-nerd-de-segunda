import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProgressState } from '../types';
import { rankingEnabled, submitBlockedHere, submitScore } from '../data/leaderboard';
import { GAME_URL_SHORT } from '../utils/platform';
import { totalEpisodePoints } from '../game/progress';
import { Button } from './ui';

type State =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; rank: number; total: number; points: number }
  | { status: 'error'; message: string };

interface Props {
  progress: ProgressState;
  /** Envia logo ao aparecer (se houver nome). */
  auto?: boolean;
  onOpenRanking?: () => void;
  onSent?: () => void;
  /** O jogador já aparece no ranking. */
  inRanking?: boolean;
}

/** Envia os pontos acumulados do Modo Episódios para o ranking geral online. */
export function RankingSubmit({ progress, auto, onOpenRanking, onSent, inRanking }: Props) {
  const [state, setState] = useState<State>({ status: 'idle' });
  const autoDone = useRef(false);
  const hasName = !!progress.settings.playerName.trim();
  // O envio automático só acontece se o nome já existia quando o ecrã abriu;
  // um nome escrito agora é enviado pelo botão (evita enviar nomes a meio da escrita).
  const nameAtMount = useRef(hasName);
  const total = totalEpisodePoints(progress);

  const send = useCallback(async () => {
    setState({ status: 'sending' });
    try {
      const r = await submitScore(progress);
      setState({ status: 'sent', rank: r.rank ?? 0, total: r.total ?? 0, points: r.points ?? total });
      onSent?.();
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' });
    }
  }, [progress, total, onSent]);

  useEffect(() => {
    if (auto && nameAtMount.current && !autoDone.current && hasName && rankingEnabled() && !submitBlockedHere() && total > 0) {
      autoDone.current = true;
      void send();
    }
  }, [auto, hasName, total, send]);

  if (!rankingEnabled()) {
    return <p className="rank-note">O ranking geral online fica activo em breve. Os teus pontos acumulados ficam guardados e entram logo que abrir.</p>;
  }

  if (submitBlockedHere()) {
    return (
      <div className="rank-submit">
        <p className="rank-note">
          Durante o passatempo, só conta para o ranking quem joga na versão online: <b>{GAME_URL_SHORT}</b>. Aqui na app podes consultar o ranking.
        </p>
        {onOpenRanking && (
          <div className="rank-actions">
            <Button variant="ghost" icon="crown" onClick={onOpenRanking}>Ver ranking geral</Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rank-submit" aria-live="polite">
      {state.status === 'sent' ? (
        <p className="rank-ok">
          Estás em <b>#{state.rank}</b> de {state.total} {state.total === 1 ? 'jogador' : 'jogadores'} no ranking geral, com <b>{state.points}</b> pontos.
        </p>
      ) : state.status === 'error' ? (
        <p className="rank-err">Não foi possível actualizar o ranking: {state.message}</p>
      ) : !hasName ? (
        <p className="rank-note">Escreve o teu nome para entrares no ranking geral com os teus {total} pontos.</p>
      ) : total === 0 ? (
        <p className="rank-note">Conclui uma partida do Modo Episódios para entrares no ranking.</p>
      ) : (
        <p className="rank-note">{state.status === 'sending' ? 'A enviar a tua pontuação…' : `Tens ${total} pontos acumulados no Modo Episódios.`}</p>
      )}
      <div className="rank-actions">
        {hasName && total > 0 && state.status !== 'sending' && state.status !== 'sent' && (
          <Button variant="secondary" icon="trophy" onClick={send}>{state.status === 'error' ? 'Tentar outra vez' : inRanking ? 'Actualizar a minha pontuação' : 'Entrar no ranking'}</Button>
        )}
        {onOpenRanking && <Button variant="ghost" icon="crown" onClick={onOpenRanking}>Ver ranking geral</Button>}
      </div>
    </div>
  );
}
