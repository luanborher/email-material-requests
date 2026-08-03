# Revisão e refatoração (ago/2026)

Resumo das melhorias aplicadas após revisão de código.

## Bugs corrigidos

| Problema | Solução |
|----------|---------|
| `isAiConfigured()` sempre true (defaults de URL/modelo) | `OLLAMA_ENABLED` explícito no `.env` |
| `parseQuantity()` derrubava o regex parser | try/catch em `parseItemLine()` — linha inválida ignorada |
| Worker marcava lido em parse falho (perda de dados) | Só marca lido após save bem-sucedido ou skip |
| Race em `gmail_message_id` duplicado | Catch unique constraint → retorna `skipped: true` |
| `manual-${Date.now()}` colidia em requisições rápidas | ID com sufixo aleatório |
| `Invalid Date` silencioso no POST `/parser/parse` | Validação de `receivedAt` |
| XSS no HTML do OAuth callback | `escapeHtml()` em valores interpolados |
| `updateStatus` null retornava pedido `processing` com itens salvos | Throw se update não encontra pedido |

## Duplicação removida

- `getErrorMessage()` centralizado em `utils/error.ts` (rotas + worker)
- `toCreatePedidoInput()` / `toCreatePedidoItemInputs()` em `database/mappers/pedido-input.mapper.ts`
- Constantes `MAX_GMAIL_MESSAGES_PER_REQUEST` em `gmail.constants.ts`

## Performance / confiabilidade

- Gmail client cacheado em `GmailService` (não recria `google.gmail()` por chamada)
- Worker usa `setTimeout` encadeado em vez de `setInterval` (sem ciclos perdidos)

## Código morto removido

- `ORDER_SYSTEM_*` removido do schema de env (não usado)
- Export `sql` removido de `connection.ts`
- Constantes OAuth path não usadas removidas de `gmail.constants.ts`
- `callLlm()` wrapper removido de `llm-pedido.parser.ts`

## Legibilidade

- `OBRA_PATTERN` → `OBSERVACOES_PATTERNS` (obra + observações)
- Shutdown com timeout de 10s em `server.ts`
