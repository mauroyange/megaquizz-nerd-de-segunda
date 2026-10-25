# Modelos (código real do MegaQuizz)

Copia para o projecto novo e substitui as referências ao MegaQuizz/Nerd de Segunda
(`grep -rn "MegaQuizz\|Nerd de Segunda\|mauroyange\|megaquizz\|1vg6kf" .`).

| Ficheiro | Para quê | Destino no projecto |
|---|---|---|
| src/types.ts | Contratos de dados | src/types/index.ts |
| src/config.ts | Pontuação, regras, ranking | src/game/config.ts |
| src/session.ts, scoring.ts, progress.ts, questionPicker.ts, validation.ts, availability.ts | Lógica pura do jogo | src/game/ |
| src/game.test.ts | Testes unitários da lógica | src/game/ |
| src/helpers.ts | Função `q()` para escrever perguntas | src/data/questions/ |
| src/useCountdown.ts, useInstallPrompt.ts | Temporizador com pausa; instalar PWA | src/hooks/ |
| src/PixelIcon.tsx | Ícones pixel-art originais | src/components/ |
| src/storyImage.ts, shareResult.ts | Imagem 1080×1920 e partilha | src/share/ |
| src/leaderboard.ts | Cliente do ranking online | src/data/ |
| src/platform.ts, storage.ts, random.ts | Ambiente, localStorage, aleatório | src/utils/ |
| src/capacitor.config.ts | App Android | raiz |
| public/manifest.webmanifest, sw.js | PWA | public/ |
| artifact/* | Build de ficheiro único (React do CDN) | raiz e scripts/ |
| scripts/e2e.cjs, e2e-ranking.cjs | Testes no navegador | scripts/ |
| scripts/make-icons.cjs | Ícones PWA/Android a partir do logótipo | scripts/ |
| scripts/make-artifact.mjs | Junta o build num fragmento HTML | scripts/ |
| scripts/crop-logo-svg.py | Logótipo .ai/PDF → SVG recortado | (ferramenta) |
| server/ranking.gs | Servidor do ranking (Apps Script) | server/ |
| workflows/deploy.yml, android.yml, ranking-check.yml | GitHub Actions | .github/workflows/ |

Dependências usadas: react@18.3.1, react-dom@18.3.1, vite@5, @vitejs/plugin-react@4, typescript@5,
vitest@2, jsdom, @fontsource/*, @capacitor/core|android|cli@7, @capacitor/share@7, @capacitor/filesystem@7.
