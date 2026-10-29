# Lições do MegaQuizz (bugs reais e limitações do ambiente)

Lê antes de começar — cada ponto custou uma iteração.

## Bugs do jogo apanhados pelos testes

| Sintoma | Causa | Solução |
|---|---|---|
| Enter deixa de avançar depois de responder | O foco sai do botão "Seguinte" se o jogador clicar noutro lado | Atalho global: em fase de feedback, Enter fora de botões chama `next` |
| Abrir "Sair" e cancelar reinicia o temporizador | O efeito do temporizador recomeçava do zero ao retomar | Acumular o tempo decorrido entre pausas (`useCountdown` com `accRef`) |
| O nome era enviado para o ranking à primeira letra | Envio automático reagia a `hasName` a mudar enquanto se escrevia | Só enviar automaticamente se o nome já existia ao abrir o ecrã; senão, botão |
| Rodapé da imagem de stories sobreposto | Posições fixas no canvas | Empilhar elementos com um cursor `y` a crescer |
| Aviso de conquista tapava o "Fechar" do diálogo | z-index dos toasts acima dos diálogos | Diálogos com z-index maior que os avisos |
| Cartão do Duelo com espaço vazio na imagem | Sem estatísticas no modo duelo | Estatísticas comparadas "A × B" |
| Gradle "Value is null" | `versionCode (x).toInteger()` em Groovy | Atribuições com `=` |

## Bugs dos testes (não do jogo)

- Seletores por texto apanham elementos a mais: "Estou pronto" também estava no parágrafo de instruções; "Sair" no título do diálogo; "Modo Episódios" no aviso dos outros modos. Usa `getByRole('button', { name, exact })`.
- `const URL = ...` num script Node esconde a classe `URL`. Usa outro nome.
- Responder sempre "a primeira opção" pode dar 0 pontos (as opções são baralhadas) — usa o mapa pergunta→resposta certa construído com `esbuild` a partir do banco.

- O `esbuild` dos testes que lê o banco de perguntas precisa de `define: { 'import.meta.env': '{}' }` quando o código usa `import.meta.env`.
- Ao testar "ficheiro em falta" com `page.route(...abort)`, o service worker pode servir o ficheiro da cache: usa um contexto novo com `serviceWorkers: 'block'`.
- Código só para testes (`if (import.meta.env.VITE_X)`) é removido da build publicada; confirma com `grep` no `dist/`.

## Limitações do ambiente da sessão

- **Sem acesso** a Instagram, `*.github.io`, `script.google.com`, cdnjs, `dl.google.com`. Verifica pelo GitHub Actions (que alcança tudo) e lê os resultados como anotações.
- **Logs do GitHub Actions bloqueados** → escreve o que precisas em `::notice title=...::` / `::error title=...::` e lê com `gh api repos/O/R/check-runs/<job-id>/annotations` (o job id vem de `gh run view <id> --json jobs`).
- **Não dá para**: gravar segredos do GitHub, activar o Pages, usar GraphQL do `gh`, criar projectos Apps Script no Drive, enviar binários grandes para o Drive (só texto escrito por ti). Planeia estes passos como acções do utilizador, com instruções claras.
- `gh workflow run` e `gh run rerun` funcionam; `gh api ... releases/latest` funciona.
- Comandos que escrevam uma password num ficheiro do repositório são bloqueados pela verificação de segurança — e bem. Mantém credenciais fora do git.
- Chromium e Playwright já instalados; `npm` funciona através do proxy.
- O directório de trabalho principal pode mudar (ex. depois de clonar o repo); a pasta temporária (scratchpad) muda com ele — envia ficheiros ao utilizador a partir da pasta actual.

## Boas práticas que resultaram

- Escrever primeiro a lógica pura + testes, depois a interface.
- Correr o teste no navegador a cada alteração relevante e **ver as capturas de ecrã**.
- Datas de pausas/eventos em ficheiro de configuração com fuso explícito (`+01:00` para Luanda) — o jogo muda sozinho, sem nova publicação.
- Pontuação acumulada = soma das melhores por nível (justa e não inflacionável).
- Confirmar tu, sempre que possível: estado do workflow, assinatura do APK, linha na folha.
