import type { Question } from '../../types';
import ep01 from './ep01';
import ep02 from './ep02';
import ep03 from './ep03';
import ep04 from './ep04';
import ep05 from './ep05';
import ep06 from './ep06';
import ep07 from './ep07';
import ep08 from './ep08';
import ep09 from './ep09';
import ep10 from './ep10';

/**
 * Banco de perguntas completo. Para adicionar perguntas a um episódio, edita
 * o ficheiro epXX.ts correspondente. Para um episódio novo, cria epXX.ts e
 * acrescenta-o aqui.
 */
export const QUESTION_BANK: Question[] = [
  ...ep01, ...ep02, ...ep03, ...ep04, ...ep05,
  ...ep06, ...ep07, ...ep08, ...ep09, ...ep10,
];
