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
import media from './media';
import { q } from './helpers';

/**
 * Banco de perguntas completo. Para adicionar perguntas a um episódio, edita
 * o ficheiro epXX.ts correspondente. Para um episódio novo, cria epXX.ts e
 * acrescenta-o aqui.
 */
export const QUESTION_BANK: Question[] = [
  ...ep01, ...ep02, ...ep03, ...ep04, ...ep05,
  ...ep06, ...ep07, ...ep08, ...ep09, ...ep10,
  ...media,
];

// Só para testes automáticos (VITE_DEMO_AUDIO=1): uma pergunta com um tom gerado,
// para verificar o leitor de áudio sem usar música com direitos. Não entra no site publicado.
if (import.meta.env.VITE_DEMO_AUDIO) {
  QUESTION_BANK.push({
    ...q(1, 99, 'casual', 'Teste de áudio', 'Que tipo de som estás a ouvir?',
      ['Um tom electrónico', 'Uma guitarra', 'Uma voz', 'Um tambor'], 'a',
      'É um tom gerado para testar o leitor de áudio.', 'Gerado com ffmpeg'),
    media: { kind: 'audio', src: 'media/audio/demo-tom.mp3', alt: 'Excerto de áudio', clipSeconds: 6, credit: 'Tom gerado para testes' },
  });
}
