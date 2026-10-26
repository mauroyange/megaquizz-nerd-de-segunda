import type { Difficulty, GameMode } from '../types';

/**
 * Valores configuráveis do jogo. Alterar aqui não exige mexer na lógica.
 */
export const SCORING = {
  /** Pontos por resposta correcta. */
  correct: 100,
  /** Bónus máximo de rapidez (proporcional ao tempo restante). */
  maxSpeedBonus: 50,
  /** Resposta incorrecta ou tempo esgotado. */
  wrong: 0,
  /** A cada N respostas correctas seguidas, ganha streakBonus. */
  streakEvery: 3,
  streakBonus: 75,
  /** Recompensa por concluir (passar) um nível. */
  levelCompletionBonus: 250,
  /** Multiplicador de pontos por dificuldade. */
  difficultyMultiplier: { casual: 1, nerd: 1.25, lenda: 1.5 } as Record<Difficulty, number>,
};

export const RULES = {
  /** Perguntas por sessão em cada modo. */
  questionsPerSession: { episode: 10, relampago: 10, sobrevivencia: Infinity, duelo: 12 } as Record<GameMode, number>,
  /** Precisão mínima (0–1) para concluir um nível e desbloquear o seguinte. */
  passAccuracy: 0.6,
  /** Ajuste do temporizador por dificuldade, em segundos. */
  timerOffset: { casual: 5, nerd: 0, lenda: -5 } as Record<Difficulty, number>,
  timerMin: 20,
  timerMax: 30,
  /** Temporizador dos modos sem episódio. */
  defaultTimer: 25,
  /** Mistura de dificuldades por sessão de episódio (soma = questionsPerSession.episode). */
  episodeMix: {
    casual: { casual: 6, nerd: 4, lenda: 0 },
    nerd: { casual: 3, nerd: 4, lenda: 3 },
    lenda: { casual: 0, nerd: 4, lenda: 6 },
  } as Record<Difficulty, Record<Difficulty, number>>,
  /** Conquista Speedrunner: tempo médio por resposta abaixo deste valor (ms). */
  speedrunAvgMs: 6000,
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  casual: 'Casual',
  nerd: 'Nerd',
  lenda: 'Modo Lenda',
};

export const DIFFICULTY_HINT: Record<Difficulty, string> = {
  casual: 'Perguntas mais acessíveis e +5 s por pergunta.',
  nerd: 'Mistura equilibrada. Pontos ×1,25.',
  lenda: 'Perguntas difíceis, −5 s por pergunta. Pontos ×1,5.',
};

export const MODE_LABEL: Record<GameMode, string> = {
  episode: 'Modo Episódios',
  relampago: 'Desafio Relâmpago',
  sobrevivencia: 'Modo Sobrevivência',
  duelo: 'Duelo Nerd',
};

/**
 * Ranking geral online (só Modo Episódios). Endereço da aplicação web do
 * Google Apps Script (server/ranking.gs). Vazio = ranking ainda não activo.
 */
export const ONLINE = {
  rankingUrl:
    (import.meta.env.VITE_RANKING_URL as string | undefined) ??
    'https://script.google.com/macros/s/AKfycbybY1d1c6SlTA5hcFxh3v3kKlIWK0HVuY9PHKiXmSnoG6bi_QbVXlcAT4AfRndqgnDbUA/exec',
};

/**
 * Passatempo em curso. Durante o período, só a versão online (site) envia
 * pontuações; a app Android mostra o ranking apenas para consulta.
 */
export const CONTEST = {
  name: 'Passatempo Kwamikon Nexus',
  prize: 'Entrada BANDO para 8 pessoas no Kwamikon Nexus',
  from: '2026-10-26T00:00:00+01:00',
  until: '2026-10-27T22:00:00+01:00',
  webOnly: true,
};

export function contestActive(now = Date.now()): boolean {
  return now >= Date.parse(CONTEST.from) && now < Date.parse(CONTEST.until);
}
