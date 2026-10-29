import { useCallback, useEffect, useRef, useState } from 'react';
import type { Difficulty, OptionId, SessionState } from '../types';
import type { PlayConfig } from '../App';
import { localRepository } from '../data/repository';
import { getEpisode } from '../data/episodes';
import { pickQuestionsForMode } from '../game/questionPicker';
import { createSession, currentQuestion, sessionReducer, type SessionAction } from '../game/session';
import { effectiveTimer, timerForQuestion } from '../game/scoring';
import { ensureMediaLoads, mediaUrl } from '../game/mediaPreload';
import { QuestionMedia } from '../components/QuestionMedia';
import { DIFFICULTY_LABEL, MODE_LABEL, RULES } from '../game/config';
import { useCountdown } from '../hooks/useCountdown';
import { Button, ConfirmDialog } from '../components/ui';
import { PixelIcon } from '../components/PixelIcon';
import { sfx } from '../utils/sound';

type Load =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; message: string }
  | { status: 'ready' };

const KEY_TO_SLOT: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
const SLOT_LABEL = ['A', 'B', 'C', 'D'];
const SLOT_TONE = ['teal', 'red', 'indigo', 'amber'];

interface Props {
  config: PlayConfig;
  difficulty: Difficulty;
  onFinish: (s: SessionState) => void;
  onQuit: () => void;
}

export function QuizPage({ config, difficulty, onFinish, onQuit }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [session, setSession] = useState<SessionState | null>(null);
  const [awaitingTurn, setAwaitingTurn] = useState(config.mode === 'duelo');
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [lastGain, setLastGain] = useState<{ points: number; bonus: number } | null>(null);
  const finishedRef = useRef(false);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const episode = config.episodeId ? getEpisode(config.episodeId) : undefined;
  const timerSeconds = effectiveTimer(episode?.timerSeconds ?? RULES.defaultTimer, difficulty);

  // Carrega e valida as perguntas antes de cada sessão.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = config.mode === 'episode' && config.episodeId
          ? await localRepository.getByEpisode(config.episodeId)
          : await localRepository.getAll();
        if (cancelled) return;
        if (res.issues.length) console.warn('Perguntas ignoradas por falharem a validação:', res.issues);
        const picked = pickQuestionsForMode(config.mode, res.questions, difficulty);
        // Carrega imagens e sons antes de começar; o que falhar é trocado por perguntas de texto.
        const { questions, dropped } = await ensureMediaLoads(picked, res.questions);
        if (cancelled) return;
        if (dropped.length) console.warn('Perguntas com multimédia trocadas por falha de carregamento:', dropped);
        const minimum = config.mode === 'sobrevivencia' ? 1 : Math.min(RULES.questionsPerSession[config.mode], 4);
        if (questions.length < minimum) {
          setLoad({ status: 'empty', message: 'Ainda não há perguntas suficientes para este modo. Volta mais tarde.' });
          return;
        }
        setSession(
          createSession({
            mode: config.mode,
            questions,
            difficulty,
            timerSeconds,
            episodeId: config.episodeId ?? null,
            playerNames: config.playerNames,
          }),
        );
        setLoad({ status: 'ready' });
      } catch (e) {
        if (!cancelled) setLoad({ status: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido.' });
      }
    })();
    return () => {
      cancelled = true;
    };
    // A sessão é criada uma única vez por montagem (cada nova partida tem uma key nova).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dispatch = useCallback((a: SessionAction) => setSession((s) => (s ? sessionReducer(s, a) : s)), []);

  const q = session ? currentQuestion(session) : undefined;
  const phase = session?.phase;
  const running = load.status === 'ready' && phase === 'question' && !awaitingTurn && !confirmQuit;
  // As perguntas com som têm tempo extra para ouvir o excerto.
  const qTimer = timerForQuestion(timerSeconds, q);

  const { remaining, elapsed } = useCountdown(qTimer * 1000, running, `${q?.id ?? 'none'}-${awaitingTurn}`, () => {
    sfx.wrong();
    setLastGain(null);
    dispatch({ type: 'timeout' });
  });

  const answer = useCallback(
    (optionId: OptionId) => {
      if (!session || !q || session.phase !== 'question' || awaitingTurn) return;
      const next = sessionReducer(session, { type: 'answer', optionId, timeMs: elapsed() });
      const rec = next.answers[q.id];
      if (!rec) return;
      setLastGain(rec.correct ? { points: rec.points, bonus: rec.streakBonus } : null);
      if (rec.correct) sfx.correct();
      else sfx.wrong();
      setSession(next);
    },
    [session, q, awaitingTurn, elapsed],
  );

  const goNext = useCallback(() => {
    if (!session || session.phase !== 'feedback') return;
    setLastGain(null);
    const next = sessionReducer(session, { type: 'next' });
    if (next.mode === 'duelo' && next.phase === 'question') setAwaitingTurn(true);
    setSession(next);
  }, [session]);

  // Termina a sessão uma única vez.
  useEffect(() => {
    if (session?.phase === 'finished' && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(session);
    }
  }, [session, onFinish]);

  // Foco no botão "Seguinte" quando aparece o feedback.
  useEffect(() => {
    if (phase === 'feedback') nextBtnRef.current?.focus();
  }, [phase, q?.id]);

  // Atalhos de teclado: 1–4 / A–D para responder, Enter para avançar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!session || !q || confirmQuit || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') return;
      if (session.phase === 'feedback' && e.key === 'Enter' && target.tagName !== 'BUTTON' && target.tagName !== 'SUMMARY') {
        e.preventDefault();
        goNext();
        return;
      }
      if (session.phase === 'question' && !awaitingTurn) {
        const slot = KEY_TO_SLOT[e.key.toLowerCase()];
        if (slot !== undefined) {
          e.preventDefault();
          answer(session.optionOrder[q.id][slot]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, q, answer, goNext, awaitingTurn, confirmQuit]);

  if (load.status === 'loading') {
    return (
      <section className="quiz-state" aria-busy="true">
        <div className="loader" aria-hidden="true"><span /><span /><span /><span /></div>
        <h2>A carregar perguntas…</h2>
      </section>
    );
  }
  if (load.status === 'error' || load.status === 'empty') {
    return (
      <section className="quiz-state">
        <PixelIcon name={load.status === 'error' ? 'skull' : 'question'} size={56} color="var(--red)" />
        <h2>{load.status === 'error' ? 'Não foi possível começar' : 'Sem perguntas'}</h2>
        <p>{load.message}</p>
        <Button variant="primary" onClick={onQuit}>Voltar</Button>
      </section>
    );
  }
  if (!session || !q) return null;

  const record = session.answers[q.id];
  const order = session.optionOrder[q.id];
  const player = session.players[session.currentPlayer];
  const isSurvival = session.mode === 'sobrevivencia';
  const total = session.questions.length;
  const secondsLeft = Math.ceil(remaining / 1000);
  const ratio = remaining / (qTimer * 1000);
  const urgent = phase === 'question' && secondsLeft <= 5;
  const heading = episode ? `Ep. #${episode.episodeNumber} · ${episode.title}` : MODE_LABEL[session.mode];

  return (
    <section className="quiz">
      <div className="quiz-hud">
        <button type="button" className="back-btn" onClick={() => setConfirmQuit(true)}>
          <span aria-hidden="true">◀</span> Sair
        </button>
        <div className="hud-title">
          <span className="hud-mode">{heading}</span>
          <span className="hud-diff">{DIFFICULTY_LABEL[session.difficulty]}</span>
        </div>
        <div className="hud-score" aria-label={`Pontuação: ${player.score}`}>
          {session.mode === 'duelo' ? (
            <div className="duel-scores">
              {session.players.map((p, i) => (
                <span key={i} className={i === session.currentPlayer ? 'active' : ''}>
                  {p.name}: <b>{p.score}</b>
                </span>
              ))}
            </div>
          ) : (
            <>
              <span className="hud-label">Pontos</span>
              <span className="hud-value">{player.score}</span>
            </>
          )}
          {lastGain && (
            <span className="gain" key={q.id}>+{lastGain.points + lastGain.bonus}</span>
          )}
        </div>
      </div>

      <div className="quiz-meta">
        <span className="q-counter">
          {isSurvival ? `Pergunta ${session.index + 1}` : `Pergunta ${session.index + 1}/${total}`}
        </span>
        <span className="q-category">{q.category}</span>
        <span className={`streak ${player.streak >= 3 ? 'hot' : ''}`} title="Respostas correctas seguidas">
          <PixelIcon name="flame" size={14} /> {player.streak}
        </span>
      </div>

      {!isSurvival && (
        <ol className="q-dots" aria-label="Progresso no nível">
          {session.questions.map((qq, i) => {
            const r = session.answers[qq.id];
            const state = r ? (r.correct ? 'ok' : 'ko') : i === session.index ? 'now' : '';
            return <li key={qq.id} className={state} aria-label={`Pergunta ${i + 1}${r ? (r.correct ? ': certa' : ': errada') : ''}`} />;
          })}
        </ol>
      )}

      <div className={`timer ${urgent ? 'urgent' : ''}`} aria-hidden={phase !== 'question'}>
        <div className="timer-track">
          <div className="timer-fill" style={{ transform: `scaleX(${phase === 'question' ? ratio : record ? 0 : 1})` }} />
        </div>
        <span className="timer-num" aria-live="off">{phase === 'question' ? <>{secondsLeft}<small>s</small></> : '—'}</span>
      </div>

      <div className="question-card">
        <h2 className="question-text">{q.question}</h2>
      </div>

      {q.media && <QuestionMedia key={q.id} media={q.media} answered={!!record} active={running} />}

      <div className={`answers ${q.optionImages ? 'with-images' : ''}`} role="group" aria-label="Alternativas">
        {order.map((optId, slot) => {
          const text = q.options[['a', 'b', 'c', 'd'].indexOf(optId)];
          const isCorrect = optId === q.correctOptionId;
          const isPicked = record?.selected === optId;
          let state = '';
          if (record) state = isCorrect ? 'correct' : isPicked ? 'wrong' : 'dim';
          return (
            <button
              key={optId}
              type="button"
              className={`answer ${state}`}
              onClick={() => answer(optId)}
              disabled={!!record || awaitingTurn}
              aria-label={`${SLOT_LABEL[slot]}: ${text}${record ? (isCorrect ? ' (resposta correcta)' : isPicked ? ' (a tua resposta)' : '') : ''}`}
            >
              <span className={`answer-key tone-${SLOT_TONE[slot]}`}>{SLOT_LABEL[slot]}</span>
              {q.optionImages && (
                <img className="answer-img" src={mediaUrl(q.optionImages[['a', 'b', 'c', 'd'].indexOf(optId)])} alt="" width={96} height={96} />
              )}
              <span className="answer-text">{text}</span>
              {record && isCorrect && <PixelIcon name="check" size={20} color="var(--teal)" className="answer-mark" />}
            </button>
          );
        })}
      </div>

      {record && (
        <div className={`feedback ${record.correct ? 'ok' : 'ko'}`} role="status">
          <div className="feedback-head">
            <strong>
              {record.correct ? 'Certo!' : record.selected === null ? 'Tempo esgotado!' : 'Errado!'}
            </strong>
            {record.correct && (
              <span className="feedback-points">
                +{record.points}{record.streakBonus ? ` · sequência +${record.streakBonus}` : ''}
              </span>
            )}
            {isSurvival && !record.correct && <span className="feedback-points">Fim da sobrevivência</span>}
          </div>
          <p>{q.explanation}</p>
          {q.source && <p className="source">Fonte: {q.source}</p>}
          {q.media?.credit && q.media.credit !== q.source && <p className="source">{q.media.kind === 'audio' ? 'Excerto' : 'Imagem'}: {q.media.credit}</p>}
          <Button ref={nextBtnRef} variant="primary" onClick={goNext}>
            {session.phase === 'feedback' && (session.eliminated || session.index >= total - 1) ? 'Ver resultados' : 'Seguinte'}
          </Button>
        </div>
      )}

      {awaitingTurn && session.mode === 'duelo' && (
        <div className="turn-overlay" role="dialog" aria-modal="true" aria-labelledby="turn-title">
          <div className="turn-card">
            <PixelIcon name="swords" size={48} color="var(--amber)" />
            <p className="turn-kicker">Pergunta {session.index + 1} de {total}</p>
            <h2 id="turn-title">Vez de {player.name}</h2>
            <p>Passa o dispositivo. O tempo só começa quando carregares em "Estou pronto".</p>
            <Button variant="primary" autoFocus onClick={() => setAwaitingTurn(false)}>Estou pronto</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmQuit}
        title="Sair desta partida?"
        body="As respostas desta sessão não ficam guardadas. O progresso anterior mantém-se."
        confirmLabel="Sair"
        onCancel={() => setConfirmQuit(false)}
        onConfirm={onQuit}
      />
    </section>
  );
}
