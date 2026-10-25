# Entrega: Artifact, GitHub, Pages, PWA e APK

## 1. Artifact (pré-visualização imediata na conversa)

1. Copia `assets/artifact/vite.artifact.config.ts` e os três shims (`react-global.js`, `react-dom-global.js`, `jsx-runtime-global.js`) para o projecto (`scripts/`). Eles fazem o código usar `window.React`/`window.ReactDOM` em vez de embutir o React.
2. `"build:artifact": "vite build --config vite.artifact.config.ts && node scripts/make-artifact.mjs"` — gera `artifact/<nome>.html`, um fragmento (sem `<html>/<body>`) com CSS e JS embutidos e React 18.3.1 do cdnjs.
3. Imagens e fontes ficam embutidas (`assetsInlineLimit` alto). Tamanho típico 150–450 KB.
4. Testa: embrulha o fragmento num HTML completo, troca os URLs do cdnjs pelos ficheiros de `node_modules/react/umd/` e `node_modules/react-dom/umd/`, serve com `python3 -m http.server` e corre o `e2e.cjs` contra ele.
5. Publica com a ferramenta Artifact (ícone `game`). O link é privado até o utilizador partilhar.

## 2. GitHub

O utilizador tem de:
1. Ligar o GitHub em https://claude.ai/connect-github e instalar a Claude GitHub App.
2. Criar o repositório **vazio** (sem README/.gitignore/licença) e **público** (Pages grátis) em https://github.com/new.
3. Em https://github.com/settings/installations → Configure → dar acesso a "All repositories" ou ao repo novo. Se o `add_repo` disser "not found", é quase sempre este passo ou o repo ainda não existir.

Tu: `add_repo(owner, repo, access: "push")` → `git clone --depth 1 ...` → `git pull <projecto-local> main` dentro do clone → `git push -u origin main` → `register_repo_root`. Commits com as linhas de atribuição pedidas pela sessão.

Limitações da sessão: a API GraphQL do `gh` está bloqueada (usa `gh api repos/...` REST); `gh release download` falha — usa `gh api -H "Accept: application/octet-stream" repos/O/R/releases/assets/<id>`; os logs dos workflows não se descarregam — ver truque das anotações em `licoes.md`.

## 3. GitHub Pages

- Workflow `assets/workflows/deploy.yml` (Node 20, `npm ci`, `npm test`, `npm run build`, `upload-pages-artifact`, `deploy-pages`).
- `vite.config.ts` com `base: './'` para funcionar em `https://<user>.github.io/<repo>/`.
- **Primeira vez**: o passo `configure-pages` falha com "Resource not accessible by integration". O utilizador abre `https://github.com/<user>/<repo>/settings/pages` e escolhe *Source: GitHub Actions*. Depois `gh run rerun <id>`.
- A sessão não consegue abrir `*.github.io` (DNS/proxy). Confirma pelo sucesso do workflow e pede ao utilizador para abrir o link.

## 4. PWA

- `public/manifest.webmanifest` (name, short_name, start_url/scope `./`, display standalone, cores, ícones 192/512/maskable).
- Ícones: `node scripts/make-icons.cjs` (Playwright renderiza o SVG do logótipo sobre o fundo da marca) → `public/icons/*` e `resources/*` (1024, foreground transparente, splash 2732).
- `public/sw.js`: página com rede-primeiro + cache; ficheiros estáticos com cache-primeiro. Registo só em produção, só se houver `<link rel="manifest">` (assim não regista dentro do Artifact) e nunca dentro do Capacitor.
- `useInstallPrompt` mostra "Instalar app" quando o navegador dispara `beforeinstallprompt`.
- Teste: Playwright → manifesto carrega, `navigator.serviceWorker.controller` activo depois de recarregar, `context.setOffline(true)` e o jogo continua a abrir e a mostrar perguntas.

## 5. APK Android (Capacitor 7)

1. `npm i @capacitor/core@7 @capacitor/android@7` e `-D @capacitor/cli@7`; `capacitor.config.ts` (`appId` tipo `ao.marca.jogo` — fica para sempre; `webDir: 'dist'`; cor de fundo).
2. `npm run build && npx cap add android` (não precisa de SDK local). O directório `android/` vai para o git.
3. Ícones: com ImageMagick a partir de `resources/icon-1024.png` → `mipmap-*/ic_launcher.png` (48/72/96/144/192), `ic_launcher_round.png` (máscara circular) e `ic_launcher_foreground.png` (108/162/216/324/432 a partir do foreground transparente); `values/ic_launcher_background.xml` com a cor da marca; substituir todos os `splash.png` por fundo da marca + logótipo centrado.
4. `android/app/build.gradle`:
   - `versionCode = Integer.parseInt(System.getenv("VERSION_CODE") ?: "1")` e `versionName = System.getenv("VERSION_NAME") ?: "1.0"` — **usa `=`**; a sintaxe `versionCode (x).toInteger()` dá "Value is null".
   - `signingConfigs.release` lê `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (omissão "nome-da-app"), `ANDROID_KEY_PASSWORD` (omissão = password da keystore).
5. Workflow `assets/workflows/android.yml`: Node 22, Java 21 (`setup-java@v5`), **SDK que já vem no runner** (não uses `android-actions/setup-android`, falhou), aceitar licenças, `npm test`, build, `npx cap sync android`, descodificar a keystore do segredo, `./gradlew assembleRelease bundleRelease`, publicar `gh release create v1.0.<run> APK AAB --latest`. Link fixo para o utilizador: `https://github.com/<user>/<repo>/releases/latest/download/<Nome>.apk`.
6. Erros do Gradle: o workflow escreve a secção "What went wrong" como anotação (`::error title=Gradle::`) — lê-a com `gh api repos/O/R/check-runs/<job>/annotations`.

### Assinatura (importante)

- Gera a chave com `keytool -genkeypair ... -keystore <nome>-release.jks -alias <nome>`, password aleatória (`openssl rand -hex 16`). **Nunca** a ponhas no repositório.
- A sessão não consegue gravar segredos no GitHub (o proxy bloqueia). Envia ao utilizador, com `SendUserFile`, um ficheiro por valor: `1 - ANDROID_KEYSTORE_BASE64.txt` (o `.jks` em base64) e `2 - ANDROID_KEYSTORE_PASSWORD.txt`. Explica: Name = nome do ficheiro, Secret = conteúdo, em `https://github.com/<user>/<repo>/settings/secrets/actions/new`. Envia também o `.jks` e um LEIA-ME para ele guardar fora do GitHub.
- Se precisares de APK antes de haver segredos, uma chave de teste no repo resolve temporariamente, mas retira-a assim que os segredos existirem (quem instalou a versão de teste terá de desinstalar uma vez).
- Verifica: descarrega o APK da release e `keytool -printcert -jarfile app.apk | grep Owner` deve mostrar o titular da chave definitiva.

### Play Store (quando o utilizador quiser)

Conta de programador (pagamento único), AAB (já gerado), chave definitiva, política de privacidade publicada, ficha da loja, classificação etária, segurança de dados, e — para contas pessoais novas — teste fechado com cerca de 12 testers durante 14 dias. Contas de empresa costumam estar isentas. Confirma os requisitos actuais na Play Console.

## 6. Comunicação da entrega

Para divulgação em massa recomenda o **link do site** (instala como PWA sem avisos); o APK fora da Play Store mostra "fonte desconhecida" e pode ter avisos do Play Protect. O link `*.github.io/<repo>` expõe o nome de utilizador do GitHub — sugere uma organização (ex. `marca.github.io`) ou domínio próprio se a marca importar.
