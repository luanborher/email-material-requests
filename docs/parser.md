# Parser híbrido — Task 5

Extrai pedidos de materiais do corpo do e-mail usando **regex primeiro** e **LLM como fallback**.

## Fluxo

```
E-mail
  → normaliza texto (remove HTML)
  → tenta regex
      ├─ confiança >= 0.7 → usa regex
      └─ confiança < 0.7 → chama LLM (se configurado)
  → salva pedido + itens no SQL Server (idempotente por gmail_message_id)
```

## Formato de e-mail suportado (regex)

```
Assunto: Solicitação de material

Corpo:
- 10 parafusos M8
- 5 metros de cabo PP 2,5mm

Departamento: Manutenção
Urgência: alta
Obra: 42
```

Linhas de item aceitas:
- `- 10 parafusos M8`
- `10 un parafusos M8`
- `10 - parafusos M8`

## Testar sem Gmail (manual)

```bash
POST http://localhost:3000/parser/parse
Content-Type: application/json

{
  "gmailMessageId": "teste-manual-001",
  "subject": "Solicitação de material",
  "sender": "joao@empresa.com",
  "body": "- 10 parafusos M8\n- 5 metros de cabo\nDepartamento: Manutenção\nUrgência: alta"
}
```

Resposta inclui `saved` com o pedido gravado em `pedidos` e `pedido_itens`.

## Testar com e-mail real do Gmail

1. Liste não lidos: `GET /gmail/messages/unread`
2. Copie um `gmailMessageId`
3. Parse + salvar: `GET /gmail/messages/{gmailMessageId}/parse`

Se o e-mail já foi processado, `saved.skipped` será `true` (idempotência).

## Verificar no banco

```sql
SELECT * FROM dbo.pedidos ORDER BY created_at DESC;
SELECT * FROM dbo.pedido_itens WHERE pedido_id = '<id-do-pedido>';
```

## Variáveis de ambiente (LLM fallback)

### Gemini (recomendado — free tier)

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=sua-chave-do-google-ai-studio
GEMINI_MODEL=gemini-2.0-flash-lite
AI_CONFIDENCE_THRESHOLD=0.7
```

Obtenha a key em: [aistudio.google.com](https://aistudio.google.com)

### OpenAI (alternativa)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
AI_CONFIDENCE_THRESHOLD=0.7
```

Sem chave de LLM configurada, o sistema usa **somente regex**.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/parser/parse` | Parseia e salva pedido no banco |
| `GET` | `/gmail/messages/:id/parse` | Busca e-mail no Gmail, parseia e salva |
