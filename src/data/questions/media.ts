import type { Question } from '../../types';
import { q } from './helpers';

/**
 * Perguntas com imagem. Os ficheiros estão em public/media/ e são gerados com
 * scripts/prepare-media.mjs (ver README, secção "Perguntas com imagem e som").
 *
 * Estas usam apenas os ícones oficiais do Nerd de Segunda (folha de ícones da
 * pasta "Comunicação e Marketing / Ícones" no Drive), por isso não têm questões de direitos.
 */
const C = 'Nerd de Segunda';
const ICONES = 'Ícones oficiais do Nerd de Segunda';
const img = (n: string) => `media/img/nds-${n}.webp`;
const sil = (n: string) => `media/img/nds-${n}-silhueta.webp`;

const withMedia = (base: Question, extra: Partial<Question>): Question => ({ ...base, ...extra });

export default [
  // Silhuetas — "De quem é esta silhueta?"
  withMedia(
    q(4, 16, 'casual', C, 'Esta silhueta é de um ícone do Nerd de Segunda. Que rubrica representa?',
      ['TOP NerdBoard', 'Conselho dos Nerds', 'Ranking', 'Gaming'], 'a',
      'Os auscultadores são o ícone do TOP NerdBoard, o bloco musical do programa.', ICONES),
    { media: { kind: 'image', src: sil('topnerdboard'), reveal: img('topnerdboard'), alt: 'Silhueta de um ícone em pixel-art', credit: ICONES } },
  ),
  withMedia(
    q(1, 16, 'nerd', C, 'De que ícone do Nerd de Segunda é esta silhueta?',
      ['Conselho dos Nerds', 'No Buffer', 'Cultura Pop', 'Favorito'], 'a',
      'O balão de conversa representa o Conselho dos Nerds, a rubrica com as perguntas e dilemas da comunidade.', ICONES),
    { media: { kind: 'image', src: sil('conselho'), reveal: img('conselho'), alt: 'Silhueta de um ícone em pixel-art', credit: ICONES } },
  ),
  withMedia(
    q(5, 16, 'lenda', C, 'Esta silhueta pertence a que ícone do Nerd de Segunda?',
      ['Morreu no Episódio de Hoje', 'Save Point', 'Canon ou Fanfic?', 'Tema do Episódio'], 'a',
      'A lápide com "RIP" é o ícone de "Morreu no Episódio de Hoje".', ICONES),
    { media: { kind: 'image', src: sil('morreu'), reveal: img('morreu'), alt: 'Silhueta de um ícone em pixel-art', credit: ICONES } },
  ),
  // Imagem — "Qual é o nome do que aparece na imagem?"
  withMedia(
    q(2, 16, 'casual', C, 'Que rubrica do Nerd de Segunda usa este ícone?',
      ['Explica-me como…', 'Canon ou Fanfic?', 'Tema do Episódio', 'Save Point'], 'a',
      'O bloco de interrogação é o ícone de "Explica-me como…", a rubrica que explica temas complexos de forma simples.', ICONES),
    { media: { kind: 'image', src: img('explica'), alt: 'Ícone em pixel-art de um bloco amarelo com um ponto de interrogação', credit: ICONES } },
  ),
  withMedia(
    q(7, 16, 'casual', C, 'Que tema do Nerd de Segunda é representado por este ícone?',
      ['Cultura Pop', 'Séries e Filmes', 'Gaming', 'Tecnologia'], 'a',
      'A televisão antiga é o ícone de Cultura Pop.', ICONES),
    { media: { kind: 'image', src: img('culturapop'), alt: 'Ícone em pixel-art de uma televisão antiga com antena', credit: ICONES } },
  ),
  // Alternativas em imagem — "Qual destes objectos pertence a X?"
  withMedia(
    q(4, 17, 'nerd', C, 'Qual destes ícones representa o TOP NerdBoard?',
      ['Auscultadores', 'Microfone', 'Troféu', 'Coração'], 'a',
      'O TOP NerdBoard usa os auscultadores. O microfone é "No Buffer", o troféu é "Ranking" e o coração é "Favorito".', ICONES),
    { optionImages: [img('topnerdboard'), img('nobuffer'), img('ranking'), img('favorito')] },
  ),
  withMedia(
    q(10, 16, 'nerd', C, 'Qual destes ícones do Nerd de Segunda representa o "Save Point"?',
      ['Disquete', 'Livro aberto', 'Comando de consola', 'Claquete'], 'a',
      'O "Save Point" é a disquete, como nos videojogos antigos. O livro é "Canon ou Fanfic?", o comando é "Gaming" e a claquete é "Séries e Filmes".', ICONES),
    { optionImages: [img('savepoint'), img('canon'), img('gaming'), img('series')] },
  ),
] satisfies Question[];
