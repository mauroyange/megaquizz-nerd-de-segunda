import type { Achievement } from '../types';
import { EPISODES } from './episodes';
import { RULES } from '../game/config';

/**
 * Conquistas. Os nomes e descrições podem ser alterados livremente;
 * a condição `check` é avaliada no fim de cada sessão.
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'primeiro-contacto',
    name: 'Primeiro Contacto',
    description: 'Conclui a tua primeira sessão de jogo.',
    icon: 'radio',
    check: ({ progress }) => progress.stats.sessions >= 1,
  },
  {
    id: 'mente-enciclopedia',
    name: 'Mente de Enciclopédia',
    description: 'Responde correctamente a 10 perguntas seguidas.',
    icon: 'brain',
    check: ({ summary }) => summary.maxStreak >= 10,
  },
  {
    id: 'speedrunner',
    name: 'Speedrunner',
    description: `Conclui um episódio com média inferior a ${RULES.speedrunAvgMs / 1000} s por resposta.`,
    icon: 'clock',
    check: ({ summary }) => summary.mode === 'episode' && summary.passed && summary.avgTimeMs < RULES.speedrunAvgMs,
  },
  {
    id: 'coleccionador-supremo',
    name: 'Coleccionador Supremo',
    description: 'Faz 1500 pontos ou mais no episódio de Coleccionismo Nerd.',
    icon: 'cards',
    check: ({ summary }) => summary.mode === 'episode' && summary.episodeId === 10 && summary.score >= 1500,
  },
  {
    id: 'lenda-nerdboard',
    name: 'Lenda do NerdBoard',
    description: 'Faz 1500 pontos ou mais num Desafio Relâmpago.',
    icon: 'crown',
    check: ({ summary }) => summary.mode === 'relampago' && summary.score >= 1500,
  },
  {
    id: 'mestre-10-episodios',
    name: 'Mestre dos 10 Episódios',
    description: 'Conclui os 10 episódios da Season 5.',
    icon: 'trophy',
    check: ({ progress }) => EPISODES.every((e) => progress.episodes[e.id]?.completed),
  },
  {
    id: 'perfeicao',
    name: 'Sem Spoilers',
    description: 'Acerta todas as perguntas de um episódio.',
    icon: 'star',
    check: ({ summary }) => summary.mode === 'episode' && summary.total > 0 && summary.correct === summary.total,
  },
  {
    id: 'modo-lenda',
    name: 'Nível Lendário',
    description: 'Conclui um episódio em Modo Lenda.',
    icon: 'gem',
    check: ({ summary }) => summary.mode === 'episode' && summary.passed && summary.difficulty === 'lenda',
  },
  {
    id: 'sobrevivente',
    name: 'Último Sobrevivente',
    description: 'Acerta 15 perguntas seguidas no Modo Sobrevivência.',
    icon: 'heart',
    check: ({ summary }) => summary.mode === 'sobrevivencia' && summary.correct >= 15,
  },
  {
    id: 'duelista',
    name: 'Duelo ao Pôr do Sol',
    description: 'Joga um Duelo Nerd até ao fim.',
    icon: 'swords',
    check: ({ summary }) => summary.mode === 'duelo',
  },
  {
    id: 'conselho-nerds',
    name: 'Conselho dos Nerds',
    description: 'Responde correctamente a 100 perguntas no total.',
    icon: 'medal',
    check: ({ progress }) => progress.stats.totalCorrect >= 100,
  },
  {
    id: 'aranha-sentido',
    name: 'Sentido Aranha',
    description: 'Conclui o Episódio #1 sem errar nenhuma pergunta.',
    icon: 'spider',
    check: ({ summary }) => summary.mode === 'episode' && summary.episodeId === 1 && summary.total > 0 && summary.wrong === 0,
  },
];
