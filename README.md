# MegaQuizz by Nerd de Segunda

> Tens nível para ser um verdadeiro Nerd?

Jogo de trivia para o navegador, baseado nos 10 primeiros episódios da **Season 5 do Nerd de Segunda** (Vibe FM 88.3, segundas, 20h–22h).

## Instalação e execução

Requisitos: Node.js 18 ou superior.

```bash
npm install            # instala as dependências
npm run dev            # servidor de desenvolvimento (http://localhost:5173)
npm run build          # verifica os tipos e gera a versão de produção em dist/
npm run preview        # serve a versão de produção (http://localhost:4173)
npm test               # testes unitários (lógica do jogo + banco de perguntas)
npm run build:artifact # gera artifact/megaquizz.html, um ficheiro único para publicar
```

Teste ponta-a-ponta no navegador (precisa do Playwright):

```bash
npm run build && npx vite preview --port 4173 &
node scripts/e2e.cjs   # capturas de ecrã em e2e-shots/
```

Cada push para `main` publica o jogo automaticamente no **GitHub Pages** (`.github/workflows/deploy.yml`), em `https://<utilizador>.github.io/<repositório>/`. Na primeira vez, confirma em *Settings → Pages* que a fonte é "GitHub Actions".

A pasta `dist/` também pode ser alojada em qualquer servidor estático (Netlify, Vercel, GitHub Pages, cPanel…).

## O que está implementado

| Área | Estado |
|---|---|
| Modo Episódios (10 níveis, desbloqueio progressivo) | Completo |
| Desafio Relâmpago (10 perguntas de todos os temas) | Completo |
| Modo Sobrevivência (até ao primeiro erro, dificuldade crescente) | Completo |
| Duelo Nerd local (2 jogadores, mesmo dispositivo, à vez) | Completo |
| Duelo online e rankings globais | Pendente (arquitectura preparada, não aparece como activo) |
| 3 dificuldades: Casual, Nerd, Modo Lenda | Completo |
| Temporizador de 20–30 s, pausa no diálogo de saída | Completo |
| Pontuação: certa, rapidez, sequência, conclusão, multiplicador | Completo |
| 12 conquistas, recordes, perfil, estatísticas | Completo |
| Progresso guardado no navegador (localStorage), reiniciar com confirmação | Completo |
| Revisão das respostas no fim de cada partida | Completo |
| Efeitos sonoros 8-bit (desligáveis) | Completo |
| Teclado (1–4 / A–D, Enter), foco visível, `prefers-reduced-motion` | Completo |
| Responsivo: telemóvel, tablet e computador | Completo |

## Regras e valores (editáveis em `src/game/config.ts`)

- Resposta certa: **100 pts**. Bónus de rapidez: **até 50 pts**. Errada ou tempo esgotado: **0**.
- A cada **3 certas seguidas**: **+75 pts**. Concluir um episódio: **+250 pts**.
- Multiplicador: Casual ×1, Nerd ×1,25, Lenda ×1,5.
- Temporizador: 25 s base por episódio; Casual +5 s, Lenda −5 s (sempre entre 20 e 30 s).
- Um episódio fica **concluído** com **60%** de acertos ou mais; isso desbloqueia o seguinte.
- Cada partida de episódio tem 10 perguntas sorteadas das 15 disponíveis, com mistura por dificuldade:
  Casual = 6 casual + 4 nerd; Nerd = 3 + 4 + 3; Lenda = 4 nerd + 6 lenda.
- "Domínio" (%) = perguntas diferentes já acertadas nesse episódio ÷ total do episódio.

## Estrutura

```
src/
  types/            contratos (Question, Episode, SessionState, ProgressState…)
  data/
    episodes.ts     os 10 níveis (títulos, descrições, ícones, cores, temporizador)
    questions/      banco de perguntas, um ficheiro por episódio (ep01.ts … ep10.ts)
    achievements.ts conquistas (nome, descrição, ícone, condição)
    repository.ts   acesso às perguntas (assíncrono, pronto para uma API) + interface de rankings
  game/             lógica pura, sem React: sessão, pontuação, sorteio, progressão, validação
  hooks/            useProgress (persistência), useCountdown (temporizador com pausa)
  components/       botões, logótipo, ícones pixel-art, diálogos, avisos
  pages/            Início, Modos, Mapa, Jogo, Resultados, Perfil, Como jogar, Duelo
  assets/           logótipo oficial (SVG extraído do .ai) e ilustração da arcada
```

## Como editar conteúdos

**Temas dos episódios** — `src/data/episodes.ts`. Cada nível tem `title`, `subtitle`, `description`, `icon`, `accent`, `timerSeconds`, `image` (opcional) e `official`. Com `official: false`, o mapa mostra o nível com a etiqueta "Placeholder". Os 10 temas actuais são todos oficiais, tirados dos roteiros da pasta *Roteiros / Season 5 / Realizados*.

**Perguntas** — `src/data/questions/epXX.ts`. Formato:

```ts
q(10, 16, 'nerd', 'Coleccionismo Nerd',
  'Texto da pergunta?',
  ['Alternativa a', 'Alternativa b', 'Alternativa c', 'Alternativa d'], 'a',
  'Explicação curta mostrada depois da resposta.',
  'Fonte (opcional)'),
```

Isto gera o id `ep10_q016`. As alternativas são baralhadas em cada partida. Depois de editar, corre `npm test`: a validação confirma que cada pergunta tem 4 opções distintas, uma resposta correcta válida, todos os campos obrigatórios e ids únicos. Perguntas inválidas são também ignoradas em tempo de jogo.

**Novo episódio (ex.: #11)** — acrescenta-o a `EPISODES`, cria `ep11.ts` e importa-o em `questions/index.ts`.

**Conquistas** — `src/data/achievements.ts` (nomes e descrições livres; `check` define a condição).

**Logótipo e imagens** — `src/assets/`. O logótipo vem do ficheiro oficial `NERD DE SEGUNDA.ai`.

## Fontes do conteúdo

- Roteiros oficiais S5E1–S5E10 e *Apresentação do Projecto — Nerd de Segunda* (Google Drive da produção).
- Luanda Cartoon: notícias da Ver Angola e ANGOP (fundação em 2003, irmãos Lindomar e Olímpio de Sousa, parceria com o Camões, edição de 2025 dedicada aos 50 anos da independência).
- Restantes perguntas: factos de cultura pop amplamente documentados; a fonte aparece no jogo quando relevante.

Algumas perguntas da categoria "Nerd de Segunda" usam dados dos roteiros (planeamento). Se algo mudou na emissão, edita a pergunta correspondente.

## Pendente / próximos passos

- Duelo online e rankings globais (interface `LeaderboardService` já definida em `repository.ts`).
- Perguntas sobre o que foi efectivamente dito em antena (convidados, Top 10, TOP NerdBoard de cada semana).
- Mostrar imagens próprias por episódio no mapa (o campo `image` já existe nos dados, mas ainda não é usado na interface).
- Partilha de resultados nas redes sociais.
