import { q, SRC_DECK } from './helpers';

const C = 'Banda Desenhada';
const LC = 'Luanda Cartoon';
const SRC_LC = 'Ver Angola / ANGOP — notícias sobre o Luanda Cartoon';

export default [
  // Casual
  q(3, 1, 'casual', LC, 'O Luanda Cartoon é um festival dedicado a quê?',
    ['Banda desenhada e animação', 'Cinema de terror', 'Videojogos', 'Música electrónica'], 'a',
    'É o Festival Internacional de Banda Desenhada e Animação de Luanda.', SRC_LC),
  q(3, 2, 'casual', C, 'O que significa a sigla BD?',
    ['Banda Desenhada', 'Base de Dados', 'Boa Diversão', 'Bloco de Desenho'], 'a',
    'BD é a forma como se diz "banda desenhada" em Angola e Portugal; no Brasil diz-se "história em quadrinhos".'),
  q(3, 3, 'casual', C, 'Como se chama o elemento gráfico onde aparecem as falas das personagens?',
    ['Balão', 'Vinheta', 'Legenda', 'Prancha'], 'a',
    'O balão guarda as falas. A vinheta é cada quadro; a prancha é a página inteira.'),
  q(3, 4, 'casual', C, 'Quem criou a Mafalda?',
    ['Quino', 'Hergé', 'Goscinny', 'Maurício de Sousa'], 'a',
    'O argentino Quino publicou a Mafalda entre 1964 e 1973.'),
  q(3, 5, 'casual', C, 'Quem criou o Tintim?',
    ['Hergé', 'Uderzo', 'Moebius', 'Franquin'], 'a',
    'O belga Hergé (Georges Remi) criou Tintim em 1929.'),
  // Nerd
  q(3, 6, 'nerd', LC, 'Em que ano foi criado o Luanda Cartoon?',
    ['2003', '1995', '2010', '2015'], 'a',
    'O festival nasceu em 2003. Em 2010 ganhou dimensão internacional.', SRC_LC),
  q(3, 7, 'nerd', LC, 'Quem está na origem do Luanda Cartoon?',
    ['Os irmãos cartoonistas Lindomar e Olímpio de Sousa', 'O Ministério da Cultura', 'Um estúdio de animação português', 'A Fundação BAI'], 'a',
    'Os irmãos de Sousa, do Estúdio Olindomar, criaram o festival.', SRC_LC),
  q(3, 8, 'nerd', C, 'Quem criou Astérix?',
    ['René Goscinny e Albert Uderzo', 'Hergé e Edgar P. Jacobs', 'Morris e Goscinny', 'Jean Giraud e Jodorowsky'], 'a',
    'Goscinny escrevia e Uderzo desenhava. Astérix estreou em 1959.'),
  q(3, 9, 'nerd', C, 'Quem escreveu "Watchmen"?',
    ['Alan Moore', 'Frank Miller', 'Neil Gaiman', 'Grant Morrison'], 'a',
    'Alan Moore escreveu e Dave Gibbons desenhou Watchmen (1986–87).'),
  q(3, 10, 'nerd', C, 'Que banda desenhada ganhou um Prémio Pulitzer?',
    ['Maus', 'Persépolis', 'Sandman', 'O Cavaleiro das Trevas'], 'a',
    '"Maus", de Art Spiegelman, recebeu um Pulitzer especial em 1992.'),
  // Lenda
  q(3, 11, 'lenda', LC, 'A 21.ª edição do Luanda Cartoon, em Agosto de 2025, celebrou que marco?',
    ['Os 50 anos da independência de Angola', 'Os 100 anos da BD angolana', 'O fim do Estúdio Olindomar', 'A estreia do festival em Benguela'], 'a',
    'A edição de 2025 foi dedicada aos 50 anos da independência nacional.', SRC_LC),
  q(3, 12, 'lenda', LC, 'Com que instituição o Luanda Cartoon é organizado em parceria?',
    ['Camões – Centro Cultural Português', 'Instituto Goethe', 'Aliança Francesa', 'British Council'], 'a',
    'O festival resulta de uma parceria entre o Estúdio Olindomar e o Camões – Centro Cultural Português.', SRC_LC),
  q(3, 13, 'lenda', C, 'Quem criou "Little Nemo in Slumberland"?',
    ['Winsor McCay', 'George Herriman', 'Will Eisner', 'Carl Barks'], 'a',
    'Winsor McCay publicou Little Nemo a partir de 1905, um marco da BD.'),
  q(3, 14, 'lenda', C, 'Em que revista apareceu o Super-Homem pela primeira vez?',
    ['Action Comics #1', 'Detective Comics #27', 'Superman #1', 'All-Star Comics #8'], 'a',
    'Action Comics #1 (1938). Detective Comics #27 marca a estreia do Batman.'),
  q(3, 15, 'lenda', 'Nerd de Segunda', 'Quando foi transmitido o primeiro episódio do Nerd de Segunda?',
    ['25 de Maio de 2021', '4 de Maio de 2021', '3 de Agosto de 2026', '1 de Janeiro de 2020'], 'a',
    'O projecto foi anunciado no Dia de Star Wars (4 de Maio) e estreou a 25 de Maio de 2021.', SRC_DECK),
];
