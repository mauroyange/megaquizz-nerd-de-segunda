import { OPTION_IDS, type AnswerRecord, type Difficulty, type GameMode, type OptionId, type PlayerState, type Question, type SessionState, type SessionSummary } from '../types';
import { RULES, SCORING } from './config';
import { answerPoints, streakBonusFor } from './scoring';
import { shuffle, type Rng } from '../utils/random';

export interface CreateSessionInput {
  mode: GameMode;
  questions: Question[];
  difficulty: Difficulty;
  timerSeconds: number;
  episodeId?: number | null;
  playerNames?: string[];
  now?: number;
  rng?: Rng;
}

function newPlayer(name: string): PlayerState {
  return { name, score: 0, correct: 0, wrong: 0, streak: 0, maxStreak: 0 };
}

export function createSession(input: CreateSessionInput): SessionState {
  const optionOrder: Record<string, OptionId[]> = {};
  for (const q of input.questions) optionOrder[q.id] = shuffle(OPTION_IDS, input.rng);
  const names = input.playerNames?.length ? input.playerNames : ['Jogador'];
  return {
    mode: input.mode,
    episodeId: input.episodeId ?? null,
    difficulty: input.difficulty,
    questions: input.questions,
    optionOrder,
    index: 0,
    phase: input.questions.length ? 'question' : 'finished',
    answers: {},
    players: names.map(newPlayer),
    currentPlayer: 0,
    timerSeconds: input.timerSeconds,
    startedAt: input.now ?? Date.now(),
    finishedAt: input.questions.length ? null : (input.now ?? Date.now()),
    completionBonus: 0,
    eliminated: false,
  };
}

export function currentQuestion(s: SessionState): Question | undefined {
  return s.questions[s.index];
}

export type SessionAction =
  | { type: 'answer'; optionId: OptionId; timeMs: number }
  | { type: 'timeout' }
  | { type: 'next'; now?: number };

/**
 * Regista uma resposta. Ignora respostas repetidas para a mesma pergunta,
 * por isso nunca se conta a mesma pergunta duas vezes.
 */
function registerAnswer(s: SessionState, selected: OptionId | null, timeMs: number): SessionState {
  const q = currentQuestion(s);
  if (!q || s.phase !== 'question' || s.answers[q.id]) return s;

  const correct = selected !== null && selected === q.correctOptionId;
  const clampedTime = Math.max(0, Math.min(timeMs, s.timerSeconds * 1000));
  const points = answerPoints(correct, clampedTime, s.timerSeconds, s.difficulty);

  const players = s.players.map((p) => ({ ...p }));
  const player = players[s.currentPlayer];
  player.streak = correct ? player.streak + 1 : 0;
  player.maxStreak = Math.max(player.maxStreak, player.streak);
  const bonus = correct ? streakBonusFor(player.streak) : 0;
  player.score += points + bonus;
  if (correct) player.correct += 1;
  else player.wrong += 1;

  const record: AnswerRecord = {
    questionId: q.id,
    selected,
    correct,
    timeMs: selected === null ? s.timerSeconds * 1000 : clampedTime,
    points,
    streakBonus: bonus,
    player: s.currentPlayer,
  };

  return {
    ...s,
    players,
    answers: { ...s.answers, [q.id]: record },
    phase: 'feedback',
    eliminated: s.mode === 'sobrevivencia' && !correct,
  };
}

function advance(s: SessionState, now: number): SessionState {
  if (s.phase !== 'feedback') return s;
  const isLast = s.index >= s.questions.length - 1;
  if (s.eliminated || isLast) return finish(s, now);
  const nextPlayer = s.mode === 'duelo' ? (s.currentPlayer + 1) % s.players.length : 0;
  return { ...s, index: s.index + 1, phase: 'question', currentPlayer: nextPlayer };
}

function finish(s: SessionState, now: number): SessionState {
  const done: SessionState = { ...s, phase: 'finished', finishedAt: now };
  if (s.mode === 'episode') {
    const acc = accuracyOf(done);
    if (acc >= RULES.passAccuracy) {
      const players = done.players.map((p, i) => (i === 0 ? { ...p, score: p.score + SCORING.levelCompletionBonus } : p));
      return { ...done, players, completionBonus: SCORING.levelCompletionBonus };
    }
  }
  return done;
}

export function sessionReducer(s: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'answer':
      return registerAnswer(s, action.optionId, action.timeMs);
    case 'timeout':
      return registerAnswer(s, null, s.timerSeconds * 1000);
    case 'next':
      return advance(s, action.now ?? Date.now());
  }
}

function answeredCount(s: SessionState): number {
  return Object.keys(s.answers).length;
}

export function accuracyOf(s: SessionState): number {
  const n = answeredCount(s);
  if (!n) return 0;
  return Object.values(s.answers).filter((a) => a.correct).length / n;
}

export function summarize(s: SessionState): SessionSummary {
  const answers = Object.values(s.answers);
  const correct = answers.filter((a) => a.correct).length;
  const total = answers.length;
  const timeMs = answers.reduce((sum, a) => sum + a.timeMs, 0);
  const accuracy = total ? correct / total : 0;
  return {
    mode: s.mode,
    episodeId: s.episodeId,
    difficulty: s.difficulty,
    score: s.players[0]?.score ?? 0,
    correct,
    wrong: total - correct,
    total,
    accuracy,
    timeMs,
    avgTimeMs: total ? timeMs / total : 0,
    maxStreak: Math.max(0, ...s.players.map((p) => p.maxStreak)),
    passed: s.mode === 'episode' ? accuracy >= RULES.passAccuracy : true,
    completionBonus: s.completionBonus,
    correctIds: answers.filter((a) => a.correct).map((a) => a.questionId),
    players: s.players,
    eliminated: s.eliminated,
  };
}
