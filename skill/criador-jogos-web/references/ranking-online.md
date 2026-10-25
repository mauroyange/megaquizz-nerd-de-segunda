# Ranking online gratuito (Google Sheets + Apps Script)

Um site no GitHub Pages é estático: para um ranking partilhado é preciso um servidor. A opção sem custos e dentro da conta Google do utilizador é uma folha de cálculo com um script publicado como aplicação web.

## O que fazes tu

1. Cria a folha no Drive (pasta do projecto) com `create_file` (mimeType `application/vnd.google-apps.spreadsheet`), vê o nome da aba (em PT é "Folha1") e escreve o cabeçalho: `playerId, nome, pontos, episodiosConcluidos, melhoresPorEpisodio, actualizadoEm, criadoEm`.
2. Copia `assets/server/ranking.gs`, troca `SHEET_ID`, `N_EPISODIOS` e `MAX_POR_EPISODIO` (máximo teórico de um nível: perguntas × pontos máximos × multiplicador + bónus de sequência + conclusão).
3. Envia o código para o Drive como texto (`contentMimeType: text/plain`, `disableConversionToGoogleType: true`) para o utilizador copiar. Não é possível criar o projecto Apps Script pela API do Drive ("requires an external mime type").
4. No jogo: `src/data/leaderboard.ts` (copia de `assets/src/leaderboard.ts`) e `ONLINE.rankingUrl` em `config.ts`, com `import.meta.env.VITE_RANKING_URL` a sobrepor para testes. Enquanto estiver vazio, o jogo mostra "ranking em preparação" (nunca dados inventados).

## O que o utilizador faz (≈3 minutos)

1. Abrir a folha → **Extensões → Apps Script**.
2. Apagar o conteúdo, colar o código, guardar (Cmd/Ctrl+S).
3. **Implementar → Nova implementação** → roda dentada → **Aplicação Web** → Executar como **Eu**, Quem tem acesso **Qualquer pessoa** → Implementar.
4. Autorizar: escolher a conta → "A Google não validou esta app" → **Avançadas → Aceder a … (não seguro) → Permitir** (é normal, o script é dele).
5. Copiar o **URL da aplicação Web** (termina em `/exec`) e enviar.

## Protocolo

- `GET <url>?limit=100&id=<playerId>` → `{ ok, total, entries:[{rank,name,points,completed,me}], me:{rank,points,completed} }`.
- `POST <url>` com corpo JSON e `Content-Type: text/plain;charset=utf-8` (evita o pedido prévio de CORS que o Apps Script não suporta) → `{ ok, rank, points, completed, total }`.
- O cliente envia **apenas** `id` (UUID anónimo gerado no dispositivo), `name` (escolhido pelo jogador, máx. 20) e `episodes: {n: {best, completed}}`. O servidor recalcula o total — nunca confia num total enviado.

## Regras do servidor (já no modelo)

- Melhor pontuação por nível nunca desce e é limitada ao máximo teórico.
- Valida o formato do id, limpa o nome (sem `<>`, sem caracteres de controlo).
- Limite de 1 envio a cada 5 s por jogador (`CacheService`), `LockService` contra escritas simultâneas.
- Desempate: mais pontos → mais níveis concluídos → quem lá chegou primeiro.

## Verificação (a sessão não alcança script.google.com)

Usa o workflow `assets/workflows/ranking-check.yml` (corre no GitHub, que alcança o Google): `gh workflow run ranking-check.yml -f post_test=true`, depois lê as anotações (`GET ranking`, `POST teste`, `GET depois do teste`). Confirma a linha na folha com `get_spreadsheet` e apaga-a com `batch_clear_values`. Por fim pede ao utilizador um teste real no navegador (o CI não testa CORS).

## Na interface

- Pontos acumulados (soma das melhores pontuações por nível) no mapa, início e resultados.
- Ecrã "Ranking geral": top 100, posição do jogador, destaque "(tu)", estados de carregamento/erro/vazio, botão actualizar, campo do nome (público).
- Envio automático no fim de um nível **só se o nome já existia quando o ecrã abriu**; se o nome for escrito agora, botão "Entrar no ranking" (senão envia "M" à primeira letra).

## Limitações a dizer ao utilizador

Não é à prova de batota de quem saiba programar (pode enviar valores dentro dos limites). Para prémios, confirmar os primeiros lugares na folha (coluna `melhoresPorEpisodio`). Apagar uma linha remove o jogador; editar a célula corrige o nome. Não mudar o URL do script nem o cabeçalho.
