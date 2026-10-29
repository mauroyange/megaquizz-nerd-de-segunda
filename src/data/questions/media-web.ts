import type { Question } from '../../types';
import { q } from './helpers';

/**
 * Perguntas com imagens e músicas da internet, todas com licença livre (domínio público,
 * CC0, CC BY ou CC BY-SA) do Wikimedia Commons. Autor, licença e página de origem de cada
 * ficheiro estão em public/media/CREDITOS.md; o crédito curto aparece no jogo depois de responder.
 *
 * Não usar arte oficial nem bandas sonoras comerciais: só fotografias de fãs (cosplay),
 * locais de filmagem, obras antigas em domínio público e gravações livres de música clássica
 * que ficou famosa no cinema. Os ficheiros são obtidos com o workflow media-fetch.yml
 * (scripts/commons.mjs) e preparados com scripts/prepare-media.mjs.
 */
const commons = (who: string, licence: string) => `${who} · ${licence} · Wikimedia Commons`;
const img = (n: string) => `media/img/${n}.webp`;
const audio = (n: string) => `media/audio/${n}.mp3`;
const C_FILMES = 'Cinema';
const C_ANIME = 'Anime';

const withMedia = (base: Question, extra: Partial<Question>): Question => ({ ...base, ...extra });

const photo = (src: string, alt: string, credit: string): Partial<Question> => ({
  media: { kind: 'image', src: img(src), alt, credit },
});
const music = (src: string, seconds: number, credit: string): Partial<Question> => ({
  media: { kind: 'audio', src: audio(src), alt: 'Excerto de música', clipSeconds: seconds, credit },
});

export default [
  // EP1 — Spider-Man
  withMedia(
    q(1, 17, 'casual', 'Cosplay', 'Que herói da Marvel este cosplayer representa?',
      ['Homem-Aranha', 'Deadpool', 'Demolidor', 'Flash'], 'a',
      'Fato vermelho com teia, olhos brancos grandes e o símbolo da aranha no peito: é o Homem-Aranha.',
      'Wikimedia Commons'),
    photo('cos-spiderman', 'Fotografia de um cosplayer com fato vermelho e preto, num palco de convenção', commons('Miguel Discart', 'CC BY-SA 2.0')),
  ),

  // EP2 — IA
  withMedia(
    q(2, 17, 'nerd', C_FILMES, 'Esta música abre o filme em que o computador HAL 9000 se revolta. Que filme é?',
      ['2001: Odisseia no Espaço', 'Blade Runner', 'O Exterminador Implacável', 'Ex Machina'], 'a',
      '"Assim Falou Zaratustra", de Richard Strauss (1896), ficou eterna na abertura de 2001: Odisseia no Espaço (1968), de Stanley Kubrick — o filme do HAL 9000.',
      'Wikimedia Commons'),
    music('musica-zarathustra', 10, commons('Kevin MacLeod (incompetech.com)', 'CC BY 3.0')),
  ),
  withMedia(
    q(2, 18, 'nerd', 'Tecnologia', 'Este supercomputador da IBM, o Deep Blue, venceu um campeão mundial de xadrez em 1997. Quem?',
      ['Garry Kasparov', 'Magnus Carlsen', 'Bobby Fischer', 'Anatoly Karpov'], 'a',
      'Em Maio de 1997 o Deep Blue venceu Garry Kasparov num encontro de seis partidas — a primeira vez que uma máquina bateu um campeão do mundo em condições de torneio.',
      'Wikimedia Commons'),
    photo('ibm-deepblue', 'Fotografia de um armário de computador preto com o logótipo da IBM, num museu', commons('James the photographer', 'CC BY 2.0')),
  ),

  // EP3 — Banda Desenhada (obras em domínio público)
  withMedia(
    q(3, 16, 'nerd', 'BD clássica', 'Esta BD de Winsor McCay, publicada desde 1905, mostra um menino a viajar pelos sonhos. Como se chama?',
      ['Little Nemo in Slumberland', 'The Yellow Kid', 'Krazy Kat', 'Mutt and Jeff'], 'a',
      'Little Nemo in Slumberland saiu no New York Herald a partir de 1905. Nesta prancha de 1908, a cama de Nemo ganha pernas e passeia pela cidade.',
      'Wikimedia Commons'),
    photo('bd-littlenemo', 'Prancha de banda desenhada antiga em que uma cama com pernas gigantes caminha entre prédios', commons('Winsor McCay', 'domínio público')),
  ),
  withMedia(
    q(3, 17, 'lenda', 'BD clássica', 'Este personagem de Richard Outcault, de 1895, é um dos primeiros heróis da BD de jornal. Como se chama?',
      ['The Yellow Kid', 'Little Nemo', 'Buster Brown', 'Popeye'], 'a',
      'The Yellow Kid, da tira Hogan\'s Alley, foi tão popular que os jornais rivais lutaram por ele — e deu origem à expressão "imprensa amarela".',
      'Wikimedia Commons'),
    photo('bd-yellowkid', 'Ilustração antiga de um miúdo careca com uma camisola amarela comprida', commons('Richard F. Outcault', 'domínio público')),
  ),

  // EP4 — Banda Sonora (música clássica que o cinema tornou famosa)
  withMedia(
    q(4, 18, 'nerd', C_FILMES, 'No filme de Francis Ford Coppola, os helicópteros atacam ao som desta música. Que filme é?',
      ['Apocalypse Now', 'Platoon', 'Nascido para Matar', 'Black Hawk Down'], 'a',
      'É "A Cavalgada das Valquírias", de Richard Wagner. Em Apocalypse Now (1979), o tenente-coronel Kilgore põe-na a tocar nos altifalantes dos helicópteros.',
      'Wikimedia Commons'),
    music('musica-valquirias', 9, commons('Gravação em domínio público', 'domínio público')),
  ),
  withMedia(
    q(4, 19, 'lenda', C_FILMES, 'Esta peça de órgão atribuída a Bach abre que filme da Disney de 1940?',
      ['Fantasia', 'Pinóquio', 'Branca de Neve e os Sete Anões', 'Dumbo'], 'a',
      'A Tocata e Fuga em Ré menor abre Fantasia (1940), num arranjo para orquestra de Leopold Stokowski, com formas abstractas a dançar ao ritmo da música.',
      'Wikimedia Commons'),
    music('musica-toccata', 10, commons('Ashtar Moïra', 'domínio público')),
  ),
  withMedia(
    q(4, 20, 'nerd', C_FILMES, '"Marte", de Gustav Holst (1914), é muitas vezes apontada como inspiração para a banda sonora de que saga?',
      ['Star Wars', 'Star Trek', 'Duna', 'Interstellar'], 'a',
      'O ritmo marcial e os metais de "Marte, o Portador da Guerra" (da suite Os Planetas) são uma referência clara para John Williams em Star Wars — basta pensar na Marcha Imperial.',
      'Wikimedia Commons'),
    music('musica-marte', 9, commons('United States Air Force Band', 'domínio público')),
  ),

  // EP5 — Universos Fantásticos
  withMedia(
    q(5, 17, 'nerd', 'Fantasia', 'Esta música de Grieg descreve o salão do rei de que criaturas — as mesmas que Bilbo encontra em O Hobbit?',
      ['Trolls', 'Elfos', 'Dragões', 'Anões'], 'a',
      '"No Salão do Rei da Montanha" (Peer Gynt, 1875) acontece na corte do rei dos trolls. Começa devagar e vai acelerando até ao caos.',
      'Wikimedia Commons'),
    music('musica-reidamontanha', 9, commons('Musopen Symphony Orchestra', 'domínio público')),
  ),
  withMedia(
    q(5, 18, 'nerd', 'Séries', 'Esta estrada de árvores na Irlanda do Norte foi a Estrada do Rei em que série?',
      ['Game of Thrones', 'The Witcher', 'Os Anéis do Poder', 'Vikings'], 'a',
      'São as Dark Hedges, no condado de Antrim. Em Game of Thrones aparecem como a Estrada do Rei, quando Arya foge de Porto Real.',
      'Wikimedia Commons'),
    photo('got-darkhedges', 'Fotografia de uma estrada estreita ladeada por faias antigas com ramos entrelaçados', commons('Colin Park', 'CC BY-SA 2.0')),
  ),
  withMedia(
    q(5, 19, 'casual', 'Séries', 'A cidade velha de Dubrovnik, na Croácia, fez de que cidade em Game of Thrones?',
      ['Porto Real', 'Winterfell', 'Braavos', 'Meereen'], 'a',
      'Dubrovnik foi Porto Real (King\'s Landing) a partir da segunda temporada. As muralhas e as escadas da cidade velha aparecem em várias cenas.',
      'Wikimedia Commons'),
    photo('got-dubrovnik', 'Vista aérea de uma cidade antiga com telhados cor de laranja junto ao mar', commons('japus', 'CC BY 2.5')),
  ),
  withMedia(
    q(5, 20, 'casual', 'Cosplay', 'Que feiticeiro da Terra Média este cosplayer representa?',
      ['Gandalf', 'Saruman', 'Radagast', 'Dumbledore'], 'a',
      'Chapéu pontiagudo, barba longa, manto cinzento e cajado: é Gandalf, o Cinzento. Saruman veste de branco e Dumbledore nem é da Terra Média.',
      'Wikimedia Commons'),
    photo('cos-gandalf', 'Fotografia de um cosplayer com chapéu pontiagudo cinzento, barba longa e cajado', commons('Roger Murmann', 'CC BY 2.0')),
  ),

  // EP6 — OldBig3
  withMedia(
    q(6, 16, 'casual', C_ANIME, 'Que ninja da Aldeia da Folha este cosplayer representa?',
      ['Naruto Uzumaki', 'Sasuke Uchiha', 'Kakashi Hatake', 'Rock Lee'], 'a',
      'Cabelo loiro espetado, fato cor de laranja e a bandana da Folha: é Naruto Uzumaki.',
      'Wikimedia Commons'),
    photo('cos-naruto', 'Fotografia de um cosplayer com cabelo loiro espetado e fato cor de laranja e preto', commons('Z (Flickr)', 'CC BY 2.0')),
  ),
  withMedia(
    q(6, 17, 'lenda', C_ANIME, 'Este cosplayer usa a máscara de Hollow de que protagonista?',
      ['Ichigo Kurosaki', 'Naruto Uzumaki', 'Monkey D. Luffy', 'Ken Kaneki'], 'a',
      'A máscara branca com riscas vermelhas e o cabelo laranja são da forma Hollow de Ichigo Kurosaki, de Bleach.',
      'Wikimedia Commons'),
    photo('cos-ichigo', 'Fotografia de um cosplayer de cabelo laranja com uma máscara branca de riscas vermelhas e roupa preta', commons('玄史生', 'CC0')),
  ),
  withMedia(
    q(6, 18, 'casual', C_ANIME, 'Qual destes cosplays é do protagonista de One Piece?',
      ['Chapéu de palha', 'Bandana da Folha', 'Máscara de Hollow', 'Cabelo dourado de Super Saiyajin'], 'a',
      'O chapéu de palha é a imagem de marca de Monkey D. Luffy. Os outros são Naruto, Ichigo (Bleach) e Goku (Dragon Ball).',
      'Wikimedia Commons'),
    {
      optionImages: [img('cos-luffy'), img('cos-naruto'), img('cos-ichigo'), img('cos-goku')],
      source: 'Fotografias: Michael Mol, Z, 玄史生 e MiNe — CC BY 2.0 / CC0, Wikimedia Commons',
    },
  ),

  // EP8 — Mangá
  withMedia(
    q(8, 16, 'nerd', 'Mangá', 'Estes esboços de Katsushika Hokusai, publicados a partir de 1814, ajudaram a popularizar que palavra?',
      ['Mangá', 'Anime', 'Otaku', 'Kawaii'], 'a',
      'O "Hokusai Manga" reuniu milhares de desenhos rápidos do quotidiano e ajudou a espalhar a palavra mangá ("desenhos espontâneos").',
      'Wikimedia Commons'),
    photo('manga-hokusai', 'Esboços antigos a tinta de pessoas com chapéus de chuva e cavalos', commons('Katsushika Hokusai', 'domínio público')),
  ),

  // EP9 — NewBig3
  withMedia(
    q(9, 16, 'nerd', C_ANIME, 'Que feiticeiro de Jujutsu Kaisen este cosplayer representa?',
      ['Satoru Gojo', 'Yuji Itadori', 'Megumi Fushiguro', 'Ryomen Sukuna'], 'a',
      'Cabelo branco, óculos escuros redondos e uniforme preto: é Satoru Gojo, o feiticeiro mais forte de Jujutsu Kaisen.',
      'Wikimedia Commons'),
    photo('cos-gojo', 'Fotografia de um cosplayer de cabelo branco, óculos escuros redondos e uniforme preto', commons('Solomon203', 'CC BY-SA 4.0')),
  ),
  withMedia(
    q(9, 17, 'nerd', C_ANIME, 'De que anime é o herói deste cosplay, de cabelo verde e máscara?',
      ['My Hero Academia', 'Jujutsu Kaisen', 'Demon Slayer', 'Black Clover'], 'a',
      'É Izuku Midoriya (Deku), de My Hero Academia, com o visual mais sombrio do arco em que anda sozinho como vigilante.',
      'Wikimedia Commons'),
    photo('cos-deku', 'Fotografia de um cosplayer de cabelo verde encaracolado, máscara e fato azul-escuro', commons('Super Festivals', 'CC BY 2.0')),
  ),
] satisfies Question[];
