---
name: criador-jogos-web
description: Processo completo e testado para criar jogos web de marca (trivia, quiz, desafios de conhecimento, jogos promocionais para programas de rádio, podcasts, marcas e campanhas) — do briefing e dos materiais da marca no Google Drive até ao jogo publicado no GitHub Pages, como PWA instalável, APK Android, com partilha para stories e ranking online gratuito em Google Sheets. Usa esta skill sempre que o utilizador pedir um jogo, quiz, trivia, passatempo interactivo, gamificação de um programa/marca, "um jogo que roda no navegador", uma app de perguntas, um ranking/leaderboard para um jogo, ou quiser transformar conteúdos (episódios, roteiros, produtos) num jogo — mesmo que não diga "skill" nem "web". Também serve para evoluir jogos criados com este processo (novos modos, ranking, APK, partilha, pausas de modos).
---

# Criador de Jogos Web

Processo usado para criar o **MegaQuizz by Nerd de Segunda** (programa de rádio da Vibe FM 88.3, Angola): um jogo de trivia com 10 níveis, 150 perguntas, 4 modos, conquistas, partilha em stories, ranking online, PWA e APK. Tudo o que está aqui foi feito e verificado nesse projecto; os modelos em `assets/` são o código real, a adaptar.

O objectivo é entregar **um produto funcional e com identidade**, não um protótipo. O utilizador típico é um profissional de comunicação/marketing, não um programador: explica em linguagem simples, dá passos concretos quando precisares de uma acção dele e confirma tu os resultados sempre que for possível.

## Visão geral das fases

1. **Briefing e materiais** — ler o pedido, ir buscar conteúdos e peças visuais (Drive, pesquisa), confirmar factos.
2. **Fundação** — projecto Vite + React + TypeScript, lógica do jogo separada da interface, dados editáveis.
3. **Conteúdo** — banco de perguntas verificável, com validação automática.
4. **Jogabilidade** — sessão, temporizador, pontuação, progressão, modos.
5. **Identidade visual** — tokens a partir do logótipo oficial, ícones originais, fontes incluídas.
6. **Testes** — testes unitários + teste no navegador com Playwright + revisão de capturas de ecrã.
7. **Entrega** — Artifact (pré-visualização), GitHub + GitHub Pages, PWA, APK Android.
8. **Crescimento** — partilha em stories, ranking online, pausas temporárias de modos.

Não tens de fazer tudo de uma vez: entrega primeiro uma versão jogável (fases 1–6 + Artifact) e avança para GitHub, APK e ranking quando o utilizador pedir. Mas desenha a arquitectura já a pensar nelas (ver `references/arquitectura.md`).

## 1. Briefing e materiais

- Se o pedido vier num PDF/documento, extrai o texto (`pdftotext -layout`) e segue-o como especificação. Respeita as regras dele (ex.: "não inventar temas", "não apresentar funcionalidades fictícias").
- **Google Drive**: procura a pasta da marca (`title contains '...'`), lista subpastas por `parentId`, e lê roteiros, apresentações e documentos com `read_file_content`. Os roteiros/guiões são a melhor fonte de temas, convidados e factos do próprio programa — dão perguntas que só os fãs sabem e tornam o jogo "oficial".
- **Logótipo**: ficheiros `.ai` modernos são PDF. `pdftocairo -svg -f N -l N logo.ai p.svg` e depois `python3 -I assets/scripts/crop-logo-svg.py p.svg logo.svg` dá um SVG recortado e nítido. Extrai as cores do logótipo daí (`fill="rgb(...)"`) — são a paleta da marca.
- Imagens grandes do Drive vêm em base64 num ficheiro guardado; descodifica com `jq -r .content f.txt | base64 -d`. Para tirar fundos brancos de ilustrações: ImageMagick com `-fill none -draw 'color 0,0 floodfill'` nos quatro cantos (não `-transparent white`, que estraga os brancos interiores).
- **Instagram/Facebook** normalmente não são acessíveis a partir da sessão; diz isso e usa as outras fontes.
- **Pesquisa web** só para confirmar factos que vão para perguntas (datas, fundadores, edições). Cita a fonte no campo `source` da pergunta.

## 2. Fundação técnica

Stack por omissão (funciona offline, testável, sem servidor):

- Vite 5 + React 18 + TypeScript estrito; CSS simples com tokens (sem Tailwind, menos dependências).
- **Lógica pura em `src/game/`** (sem React): sessão como *reducer*, pontuação, sorteio, progressão, conquistas, validação. Isto torna tudo testável e reutilizável.
- **Dados em `src/data/`**: episódios/níveis, perguntas (um ficheiro por nível), conquistas. Editar conteúdo nunca deve exigir mexer na lógica.
- Progresso em `localStorage` com `try/catch` e uma função `sanitize` que repara dados antigos/corrompidos.
- Navegação por estado no `App` (sem router) — simples e funciona dentro de Artifacts e APKs.

Detalhes, estrutura de pastas e contratos de tipos: `references/arquitectura.md`. Modelos prontos em `assets/src/` (`session.ts`, `scoring.ts`, `progress.ts`, `validation.ts`, `questionPicker.ts`, `useCountdown.ts`, `types.ts`, `game.test.ts`).

## 3. Conteúdo (banco de perguntas)

- 4 alternativas, 1 certa, explicação curta, fonte quando aplicável; dificuldade `casual`/`nerd`/`lenda`. Num jogo por níveis, 15 perguntas por nível (5+5+5) dão boa rejogabilidade com sessões de 10.
- Escreve na variante linguística do público (no MegaQuizz: português de Angola, ortografia "correcta/colecção/acção").
- **Só factos verificáveis.** Se não tens a certeza, troca a pergunta. Prefere factos estáveis (criadores, datas de estreia, prémios) a números que mudam.
- Inclui 1 pergunta por nível sobre o próprio programa/marca (vinda dos documentos internos) — os fãs adoram, e avisa o utilizador para confirmar as que vierem de planeamento (roteiros) e não do que foi efectivamente emitido.
- Guarda a resposta certa sempre na posição "a" e baralha em tempo de jogo — mais fácil de escrever e rever.
- Testes de validação do banco (`npm test`): 4 opções distintas, resposta válida, ids únicos, 10–15 por nível, as 3 dificuldades presentes.

## 4. Jogabilidade (valores que funcionaram)

- 100 pts por certa + até 50 de rapidez (linear no tempo restante); sequência: +75 a cada 3 certas; +250 por concluir nível; multiplicador ×1 / ×1,25 / ×1,5 por dificuldade. Tudo num `config.ts`.
- Temporizador 20–30 s (base 25; Casual +5, Lenda −5). Mede com `performance.now()` e **acumula o tempo entre pausas** — abrir um diálogo "Sair" não pode reiniciar o relógio (era uma batota fácil).
- Desbloqueio do nível seguinte com ≥ 60% de acertos; guardar melhor pontuação e "domínio" (% de perguntas diferentes já acertadas).
- O reducer ignora uma segunda resposta à mesma pergunta (nunca conta duas vezes).
- Modos: Episódios (principal), Relâmpago (10 aleatórias de vários temas), Sobrevivência (até errar, fácil→difícil), Duelo local (2 jogadores à vez, ecrã "passa o dispositivo" antes de cada pergunta e o tempo só começa no "Estou pronto").
- Teclado: 1–4/A–D para responder, Enter para avançar — com um atalho global, porque o foco sai do botão "Seguinte" se o jogador clicar noutro sítio.

## 5. Identidade visual

- Fundo e paleta da marca (no MegaQuizz: preto + 4 cores do logótipo, amarelo como acento principal). Um único tema escuro intencional é aceitável num jogo; define todas as cores como tokens.
- Tipografia: uma display com carácter (pixel, ex. *Press Start 2P*) usada com moderação + uma de interface (*Chakra Petch*) + corpo legível (*Rubik*). **Inclui as fontes no projecto** com `@fontsource/*` (subconjunto `latin`) — funcionam offline e no APK.
- Ícones originais em pixel-art desenhados como grelhas de texto num componente SVG (`assets/src/PixelIcon.tsx`) — nada de personagens ou logótipos de terceiros.
- Botões "de arcada" (borda grossa, sombra dura, efeito de premir), alternativas A/B/C/D com as cores da marca, temporizador em barra segmentada que fica vermelho nos últimos 5 s, animações curtas e `prefers-reduced-motion`.
- Mobile-first: 1 coluna abaixo de 640px, sem scroll horizontal (o teste verifica).

## 6. Testes — não entregues sem isto

1. `npx tsc -b` e `npx vitest run` (lógica + banco de perguntas).
2. Teste no navegador com Playwright (`assets/scripts/e2e.cjs`): joga um nível inteiro com 8/10 certas, verifica que um segundo clique não conta, recarrega e confirma persistência, testa o fim do tempo e a pausa, verifica telemóvel/tablet sem scroll horizontal e zero erros na consola. O script lê o banco de perguntas com `esbuild` para saber as respostas certas.
3. **Olha para as capturas de ecrã** (Read nas PNG) — apanham problemas de layout que os testes não vêem.
4. Quando um teste falha, distingue bug do jogo de bug do teste (seletores ambíguos são comuns). Os bugs reais encontrados assim no MegaQuizz estão em `references/licoes.md` — lê antes de começar.

Chromium já vem instalado no ambiente (`PLAYWRIGHT_BROWSERS_PATH`); não corras `playwright install`.

## 7. Entrega

Lê `references/entrega.md` para os passos exactos. Resumo:

- **Artifact (pré-visualização imediata)**: build de ficheiro único com React do cdnjs (`assets/artifact/*` + `assets/scripts/make-artifact.mjs`). Para testar localmente, troca os URLs do cdnjs pelos UMD de `node_modules` (o cdnjs costuma estar bloqueado na sessão).
- **GitHub**: o utilizador tem de ligar o GitHub (claude.ai/connect-github), **criar o repositório vazio e público** e dar acesso à Claude GitHub App ("All repositories" ou o repo específico). Depois `add_repo` com `access: "push"`, clonar, juntar commits e `git push`.
- **GitHub Pages**: workflow `assets/workflows/deploy.yml`. Na primeira vez o utilizador tem de escolher *Settings → Pages → Source: GitHub Actions* (a sessão não consegue activar o Pages).
- **PWA**: `manifest.webmanifest`, ícones (gerados do logótipo com `assets/scripts/make-icons.cjs`), service worker (`assets/public/sw.js`), botão "Instalar app" via `beforeinstallprompt`.
- **APK Android**: Capacitor 7 + workflow `assets/workflows/android.yml` que publica `MegaQuizz.apk` e `.aab` em GitHub Releases com link fixo `releases/latest/download/<nome>.apk`. Assinatura com chave privada guardada em **2 segredos** do GitHub (o utilizador cria-os; a sessão não consegue).
- **Google Drive**: só consegues enviar ficheiros de texto que escreves; binários (zip, APK) não. Envia o zip ao utilizador por `SendUserFile` e sugere arrastar para o Drive.

## 8. Crescimento (pedidos frequentes depois do lançamento)

- **Nome + partilha em stories**: imagem 1080×1920 desenhada em canvas (`assets/src/storyImage.ts`) com logótipo, nome, pontuação, estatísticas e link; partilha com Web Share API (ficheiro), `@capacitor/share` no APK, e download como alternativa (`assets/src/shareResult.ts`). Pré-visualização num diálogo antes de partilhar.
- **Ranking online gratuito**: Google Sheets + Google Apps Script como servidor (`assets/server/ranking.gs`, cliente `assets/src/leaderboard.ts`). Passos e limitações em `references/ranking-online.md`. Ranking = soma da melhor pontuação de cada nível (repetir não inflaciona).
- **Perguntas com imagem e som**: silhueta (com revelação do original depois de responder), imagem, alternativas em imagem e excertos de áudio (+10 s de tempo, toca sozinho, botão e tecla P). Ficheiros preparados com `assets/scripts/prepare-media.mjs` (ImageMagick + ffmpeg; corta o áudio a 10 s no máximo, gera silhuetas, regista tudo num manifesto que os testes verificam). Pré-carregamento antes da partida com troca automática por perguntas de texto se algo falhar (`assets/src/mediaPreload.ts`, `assets/src/QuestionMedia.tsx`). **Direitos de autor**: não há duração "segura"; usar material próprio ou autorizado e explicar isto ao utilizador antes de adicionar música/imagens de terceiros. Para demonstração, usa material da própria marca (ex.: ícones oficiais). Se o utilizador pedir "fontes da internet": usar só material com licença livre do Wikimedia Commons (domínio público, CC0, CC BY, CC BY-SA), obtido por um workflow do GitHub Actions (`assets/scripts/commons.mjs` + `assets/workflows/media-fetch.yml`: pesquisa → escolha → download para um branch `media-raw`), porque a sessão pode não ter acesso ao Commons. Funciona bem: fotografias de cosplay (personagens), locais de filmagem, BD/arte antiga em domínio público e gravações livres de música clássica que ficou famosa no cinema (2001, Apocalypse Now, Fantasia…). Nunca arte oficial nem bandas sonoras comerciais. Confirmar cada imagem numa folha de contacto (`montage`): evitar crianças e nomes escritos na imagem; escolher o excerto de áudio pelo envelope de volume e por espectrogramas (`showspectrumpic`). Registar autor/licença/origem num `public/media/CREDITOS.md` e o crédito curto em cada pergunta. CSS: `image-rendering: pixelated` só para pixel-art, nunca para fotografias.
- **Pausar modos temporariamente** sem apagar nada: datas em `assets/src/availability.ts`; os cartões mostram cadeado e data de regresso, e o modo volta sozinho.

## Como trabalhar com o utilizador

- Começa logo; só pergunta o que for mesmo decisão dele (nome da app, público/privado, se avança para a Play Store).
- Quando ele tiver de fazer algo (criar repositório, segredos, publicar o script), dá **passos numerados, com links directos e o texto exacto a escrever**. Se ele se enganar (ex.: pôr as descrições em vez dos valores num segredo), explica com calma e simplifica (ex.: reduzir 4 segredos para 2, dar um ficheiro por valor).
- Verifica tu o resultado sempre que possível (assinatura do APK, conclusão dos workflows, linhas na folha), em vez de pedir que ele verifique.
- Nunca ponhas passwords ou chaves num repositório público; envia-as ao utilizador por ficheiro e explica que tem de as guardar fora do GitHub.
- No fim de cada entrega diz o que ficou feito, o que foi testado e o que **não** foi possível testar (ex.: menu de partilha num telemóvel real).

## Ficheiros desta skill

- `references/arquitectura.md` — estrutura de pastas, tipos, padrão do reducer, persistência.
- `references/entrega.md` — Artifact, GitHub, Pages, PWA, APK, assinatura, verificação.
- `references/ranking-online.md` — Google Sheets + Apps Script passo a passo.
- `references/licoes.md` — bugs reais e limitações do ambiente, com as soluções.
- `assets/` — código real do MegaQuizz para copiar e adaptar (procura por "MegaQuizz", "Nerd de Segunda", "mauroyange" e ids de folhas para substituir).
