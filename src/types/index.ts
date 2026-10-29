// Tipos centrais do MegaQuizz. Os dados (episódios, perguntas, conquistas)
// e a lógica do jogo dependem apenas destes contratos.

export type Difficulty = 'casual' | 'nerd' | 'lenda';
export type OptionId = 'a' | 'b' | 'c' | 'd';
export const OPTION_IDS: readonly OptionId[] = ['a', 'b', 'c', 'd'];

/** Imagem ou excerto de áudio associado a uma pergunta. Caminhos relativos a public/. */
export interface QuestionMedia {
  kind: 'image' | 'audio';
  /** Ex.: "media/img/nds-topnerdboard-silhueta.webp" ou "media/audio/ep04-tema.mp3". */
  src: string;
  /** Descrição acessível; não deve revelar a resposta. */
  alt: string;
  /** Imagem mostrada depois de responder (ex.: o original de uma silhueta). */
  reveal?: string;
  /** Crédito/fonte do material, mostrado depois de responder. */
  credit?: string;
  /** Áudio: duração do excerto em segundos (máximo RULES.maxClipSeconds). */
  clipSeconds?: number;
}

export interface Question {
  /** Identificador único, ex.: "ep10_q001". */
  id: string;
  /** Episódio a que a pergunta pertence (1–10). */
  episodeId: number;
  category: string;
  difficulty: Difficulty;
  question: string;
  /** Quatro alternativas, pela ordem a, b, c, d. */
  options: [string, string, string, string];
  correctOptionId: OptionId;
  explanation: string;
  /** Fonte ou referência factual, quando aplicável. */
  source: string | null;
  /** true para conteúdo de demonstração ainda não verificado. */
  demo?: boolean;
  /** Pergunta com imagem (silhueta, personagem…) ou com som (excerto de música). */
  media?: QuestionMedia;
  /** Alternativas em imagem (pela ordem a, b, c, d); o texto de options serve de legenda e de alt. */
  optionImages?: [string, string, string, string];
}

export type IconName =
  | 'spider' | 'robot' | 'balloon' | 'note' | 'castle' | 'scroll'
  | 'mask' | 'book' | 'bolt' | 'cards' | 'trophy' | 'star' | 'flame'
  | 'clock' | 'heart' | 'skull' | 'crown' | 'swords' | 'medal'
  | 'lock' | 'check' | 'play' | 'question' | 'gem' | 'brain' | 'radio';

export interface Episode {
  /** Número do nível (1–10). */
  id: number;
  /** Número do episódio na Season 5. */
  episodeNumber: number;
  title: string;
  subtitle?: string;
  description: string;
  icon: IconName;
  /** Cor de destaque do cartão (token CSS sem "--"). */
  accent: 'teal' | 'red' | 'indigo' | 'amber';
  /** Data de emissão (AAAA-MM-DD), quando conhecida. */
  airDate?: string;
  guests?: string[];
  /** Segundos por pergunta neste nível (20–30). */
  timerSeconds: number;
  /** true = tema oficial confirmado. false = placeholder de desenvolvimento. */
  official: boolean;
  /** Imagem opcional do episódio (URL ou caminho em /public). */
  image?: string;
}

export type GameMode = 'episode' | 'relampago' | 'sobrevivencia' | 'duelo';

export interface AnswerRecord {
  questionId: string;
  selected: OptionId | null; // null = tempo esgotado
  correct: boolean;
  timeMs: number;
  points: number;
  streakBonus: number;
  player: number;
}

export interface PlayerState {
  name: string;
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  maxStreak: number;
}

export type SessionPhase = 'question' | 'feedback' | 'finished';

export interface SessionState {
  mode: GameMode;
  episodeId: number | null;
  difficulty: Difficulty;
  questions: Question[];
  /** Ordem de apresentação das alternativas por pergunta. */
  optionOrder: Record<string, OptionId[]>;
  index: number;
  phase: SessionPhase;
  answers: Record<string, AnswerRecord>;
  players: PlayerState[];
  /** Jogador activo (sempre 0 fora do Duelo). */
  currentPlayer: number;
  timerSeconds: number;
  startedAt: number;
  finishedAt: number | null;
  completionBonus: number;
  /** Sobrevivência: true se terminou por erro/tempo. */
  eliminated: boolean;
}

export interface EpisodeProgress {
  completed: boolean;
  bestScore: number;
  bestAccuracy: number;
  bestDifficulty: Difficulty | null;
  plays: number;
  /** Ids das perguntas já acertadas pelo menos uma vez. */
  masteredIds: string[];
  bestTimeMs: number | null;
}

export interface ProgressState {
  version: 1;
  episodes: Record<number, EpisodeProgress>;
  records: {
    relampago: number;
    sobrevivencia: number;
    dueloPlayed: number;
  };
  achievements: Record<string, number>; // id -> timestamp
  stats: {
    sessions: number;
    totalAnswered: number;
    totalCorrect: number;
    bestStreak: number;
    totalTimeMs: number;
  };
  settings: {
    difficulty: Difficulty;
    sound: boolean;
    playerName: string;
  };
  lastEpisodeId: number | null;
  /** Identificador anónimo e aleatório, usado só para o ranking online. */
  playerId: string;
}

export interface SessionSummary {
  mode: GameMode;
  episodeId: number | null;
  difficulty: Difficulty;
  score: number;
  correct: number;
  wrong: number;
  total: number;
  accuracy: number; // 0–1
  timeMs: number;
  avgTimeMs: number;
  maxStreak: number;
  passed: boolean;
  completionBonus: number;
  correctIds: string[];
  players: PlayerState[];
  eliminated: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  /** Condição avaliada após cada sessão. */
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  summary: SessionSummary;
  progress: ProgressState; // já actualizado com a sessão
}
