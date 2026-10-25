# Arquitectura de referência

## Estrutura de pastas

```
projecto/
├── index.html                  # manifest, ícones, meta PWA (sem Google Fonts)
├── package.json                # dev, build, test, build:artifact, typecheck
├── vite.config.ts              # base: './' (funciona em subpastas, ex. GitHub Pages)
├── vite.artifact.config.ts     # build de ficheiro único para Artifact
├── capacitor.config.ts         # app Android
├── public/                     # manifest.webmanifest, sw.js, icons/
├── resources/                  # ícone 1024 e splash (origem dos ícones Android)
├── android/                    # gerado por `npx cap add android` (vai para o git)
├── server/ranking.gs           # servidor do ranking (Apps Script)
├── scripts/                    # e2e.cjs, e2e-ranking.cjs, make-icons.cjs, make-artifact.mjs, shims React
├── .github/workflows/          # deploy.yml (Pages), android.yml (APK), ranking-check.yml
└── src/
    ├── types/index.ts          # contratos: Question, Episode, SessionState, ProgressState…
    ├── data/
    │   ├── episodes.ts         # níveis: título, descrição, ícone, cor, temporizador, official
    │   ├── questions/epXX.ts   # um ficheiro por nível + helpers.ts (função q())
    │   ├── achievements.ts     # conquistas com check(summary, progress)
    │   ├── repository.ts       # acesso assíncrono às perguntas (pronto para API)
    │   └── leaderboard.ts      # cliente do ranking online
    ├── game/                   # LÓGICA PURA, sem React
    │   ├── config.ts           # SCORING, RULES, ONLINE, rótulos
    │   ├── session.ts          # createSession, sessionReducer, summarize
    │   ├── scoring.ts          # speedBonus, answerPoints, streakBonusFor, effectiveTimer
    │   ├── questionPicker.ts   # mistura por dificuldade, aleatório sem repetir
    │   ├── progress.ts         # applySession, desbloqueio, totais, sanitize
    │   ├── achievements.ts     # evaluateAchievements
    │   ├── availability.ts     # pausas temporárias de modos
    │   └── validation.ts       # validateQuestion / validateBank
    ├── hooks/                  # useProgress (localStorage), useCountdown, useInstallPrompt
    ├── share/                  # storyImage.ts (canvas), shareResult.ts
    ├── components/             # ui.tsx, PixelIcon, ShareDialog, RankingSubmit, toasts
    ├── pages/                  # Home, Modes, LevelMap, Quiz, Results, Profile, HowToPlay, DuelSetup, Ranking
    └── utils/                  # storage, random (seeded p/ testes), sound (Web Audio), platform
```

## Padrões importantes

**Sessão como reducer puro.** `createSession({mode, questions, difficulty, timerSeconds, ...})` devolve um estado com `optionOrder` baralhado por pergunta. Acções: `answer(optionId, timeMs)`, `timeout`, `next`. O reducer:
- ignora respostas se a pergunta já tem registo (sem contagem dupla);
- calcula pontos, sequência e bónus por jogador (Duelo alterna `currentPlayer`);
- em Sobrevivência marca `eliminated` ao primeiro erro;
- ao terminar um nível com a precisão mínima, soma a recompensa de conclusão.

**Componente do jogo (QuizPage)**: carrega perguntas de forma assíncrona (estados *loading / error / empty / ready*), cria a sessão uma vez por montagem (cada partida tem uma `key` nova), usa `useCountdown` com `running = fase pergunta && !pausa && !diálogo`, chama `onFinish` uma só vez (ref).

**Progresso**: `ProgressState` versionado (`version: 1`), com `episodes[id] = {completed, bestScore, bestAccuracy, bestDifficulty, plays, masteredIds, bestTimeMs}`, recordes, conquistas (id→timestamp), estatísticas, definições (dificuldade, som, nome) e `playerId` anónimo (UUID) para o ranking. `applySession` é pura; `sanitizeProgress` repara dados antigos.

**Conquistas**: lista declarativa com `check({summary, progress})`, avaliadas depois de `applySession`; desbloqueiam uma vez.

**Nada decorativo**: botões que não funcionam não aparecem. Funcionalidades futuras aparecem como texto ("em preparação"), nunca como botão.

## Testes unitários a ter sempre

Pontuação (instantânea, errada, linear, multiplicador, sequência), limites do temporizador, sessão (certa/errada, sem contagem dupla, tempo esgotado, bónus de sequência, conclusão com e sem precisão mínima, Sobrevivência, Duelo, baralhar sem perder opções), progressão (só nível 1 aberto, desbloqueio, não desbloqueia sem passar, melhor pontuação mantida, domínio sem duplicados, dados corrompidos), conquistas únicas, sorteio sem repetição e respeitando dificuldades, validação do banco. Modelo completo: `assets/src/game.test.ts`.
