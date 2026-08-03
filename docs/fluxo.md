# Fluxo completo do sistema

Documentação do pipeline automatizado: **Gmail → parse → banco de dados**.

## Visão geral

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Gmail     │────▶│ Email Worker │────▶│ Parser híbrido  │────▶│ SQL Server   │
│  (inbox)    │     │  (polling)   │     │ regex + Ollama  │     │ pedidos +    │
└─────────────┘     └──────────────┘     └─────────────────┘     │ pedido_itens │
                                                                   └──────────────┘
```

O worker roda em background quando o servidor inicia (se Gmail está configurado e `WORKER_ENABLED=true`).

---

## Ciclo automatizado (worker)

Intervalo configurável via `EMAIL_POLL_INTERVAL_MS` (padrão: 60 segundos).

```
1. EmailWorkerService.runCycle()
2. GmailService.listUnreadMessageIds()     → IDs dos não lidos na inbox
3. Para cada ID:
   a. GmailService.getMessage()            → corpo, assunto, remetente
   b. parseAndSavePedido()                 → parse + grava no banco
   c. GmailService.markAsRead()            → remove label UNREAD
4. Log: processados / ignorados / falhas
```

**Idempotência:** se o e-mail já foi salvo (`gmail_message_id` duplicado), conta como `skipped` e ainda marca como lido.

**Parse falhou:** marca como lido para não reprocessar o mesmo e-mail indefinidamente.

**Erro ao salvar:** não marca como lido — o worker tenta de novo no próximo ciclo.

---

## Parser híbrido

```
E-mail normalizado
  → RegexPedidoParser.parse()
      ├─ confiança ≥ 0.7  → usa resultado regex
      └─ confiança < 0.7  → LlmPedidoParser.parse()
              → callOllama() (Ollama local)
```

Se Ollama não está rodando e o regex falhou, o parse retorna erro.

---

## Módulos e funções

### `src/server.ts`

| Função / bloco | O que faz |
|----------------|-----------|
| `app.listen()` | Sobe o servidor HTTP (rotas de teste e health) |
| Worker startup | Inicia `emailWorkerService` se Gmail configurado |
| `shutdown()` | Para worker, fecha servidor e pool do banco |

---

### `src/services/email-worker.service.ts`

| Função | O que faz |
|--------|-----------|
| `start()` | Agenda `runCycle()` no intervalo + executa um ciclo imediato |
| `stop()` | Para o polling |
| `runCycle()` | Lista não lidos, processa cada um, retorna métricas |
| `processMessage()` | Busca e-mail → parse + save → marca lido |

---

### `src/services/email-processing.service.ts`

| Função | O que faz |
|--------|-----------|
| `parseAndSavePedido(email)` | Orquestra parser + `PedidoService.processarEmail()` |

---

### `src/services/pedido-parser.service.ts`

| Função | O que faz |
|--------|-----------|
| `parse(email)` | Regex primeiro; se confiança baixa, chama LLM; fallback ao regex se LLM falha |

---

### `src/services/parsers/regex-pedido.parser.ts`

| Função | O que faz |
|--------|-----------|
| `parse(email)` | Extrai itens por padrões de linha (`- 10 parafusos`, etc.) |
| `calculateConfidence()` | Pontua estrutura do e-mail (0–1) |
| `extractItems()` | Lista de materiais do corpo |
| `extractUrgency()` | `alta` → high, `baixa` → low |

---

### `src/services/parsers/llm-pedido.parser.ts`

| Função | O que faz |
|--------|-----------|
| `parse(email)` | Monta prompt, chama Ollama, valida JSON com Zod |
| `buildPrompt()` | Assunto + remetente + corpo |
| `extractJson()` | Parse JSON; fallback regex se modelo manda texto extra |

---

### `src/services/parsers/llm.client.ts`

| Função | O que faz |
|--------|-----------|
| `callOllama(prompt)` | `POST /api/chat` no Ollama local; retorna JSON estruturado |

---

### `src/services/pedido.service.ts`

| Função | O que faz |
|--------|-----------|
| `processarEmail(email, dados)` | Verifica duplicata → cria pedido → cria itens → status `completed` |

---

### `src/services/gmail.service.ts`

| Função | O que faz |
|--------|-----------|
| `listUnreadMessageIds(max)` | IDs de e-mails `is:unread in:inbox` |
| `getMessage(id)` | Mensagem completa mapeada para `EmailMessage` |
| `listUnreadMessages(max)` | Lista + busca detalhes de cada uma |
| `markAsRead(id)` | Remove label `UNREAD` no Gmail |

---

### `src/repositories/pedido.repository.ts`

| Função | O que faz |
|--------|-----------|
| `findByGmailMessageId()` | Busca pedido existente (idempotência) |
| `create()` | Insere registro em `pedidos` |
| `updateStatus()` | Atualiza status, parser audit, `processado_em` |

---

### `src/repositories/pedido-item.repository.ts`

| Função | O que faz |
|--------|-----------|
| `createMany()` | Insere itens em transação em `pedido_itens` |

---

### `src/utils/email-text.ts`

| Função | O que faz |
|--------|-----------|
| `normalizeEmailBody()` | Remove HTML ou normaliza quebras de linha |
| `stripHtml()` | Converte HTML em texto |
| `parseQuantity()` | Converte quantidade string → number |

---

### `src/utils/gmail-message.parser.ts`

| Função | O que faz |
|--------|-----------|
| `mapGmailMessageToEmailMessage()` | API Gmail → `EmailMessage` |
| `extractMessageBody()` | Extrai text/plain ou text/html do payload |
| `parseSenderEmail()` | Extrai e-mail do header `From` |

---

## Variáveis de ambiente (automação)

```env
EMAIL_POLL_INTERVAL_MS=60000          # intervalo do worker (ms)
WORKER_ENABLED=true                   # false desliga o polling
WORKER_MAX_MESSAGES_PER_POLL=10       # máx e-mails por ciclo

# Gmail (obrigatório para o worker)
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...

# Ollama (fallback do parser)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
AI_CONFIDENCE_THRESHOLD=0.7
```

---

## Rotas HTTP (teste manual)

O worker automatiza o fluxo, mas as rotas continuam disponíveis para debug:

| Rota | Uso |
|------|-----|
| `GET /health` | Servidor + banco OK |
| `GET /gmail/messages/unread` | Ver não lidos |
| `GET /gmail/messages/:id/parse` | Parse + save manual de um e-mail |
| `POST /parser/parse` | Parse + save com corpo JSON fake |

---

## Como testar a automação

1. **Ollama rodando:** `ollama pull llama3.2`
2. **Banco:** `docker compose up -d`
3. **Gmail OAuth** configurado no `.env`
4. **Enviar e-mail de teste** para sua conta Gmail (formato estruturado ou informal)
5. **Subir servidor:** `npm run dev`
6. Log esperado:
   ```
   Server running on port 3000 [development]
   [worker] ativo — intervalo 60000ms, máx 10 e-mails/ciclo
   [worker] processados=1 ignorados=0 falhas=0
   ```
7. **Conferir banco:**
   ```sql
   SELECT * FROM dbo.pedidos ORDER BY created_at DESC;
   SELECT * FROM dbo.pedido_itens ORDER BY created_at DESC;
   ```
8. E-mail deve aparecer como **lido** no Gmail.

Para testar sem esperar 60s, reduza temporariamente `EMAIL_POLL_INTERVAL_MS=10000`.

---

## Status do pedido no banco

| Status | Quando |
|--------|--------|
| `processing` | Pedido criado, itens sendo salvos |
| `completed` | Parse + itens salvos com sucesso |
| `failed` | Erro ao salvar itens |

---

## O que este projeto **não** faz (por design)

- Não envia pedido a sistema externo (ERP/API)
- Não tem fila de revisão manual
- Não classifica e-mail antes do parse (rejeição implícita: sem itens = falha)

O destino final do pedido é o **SQL Server local**.
