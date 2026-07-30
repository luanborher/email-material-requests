# Gmail OAuth — Task 3

Guia para conectar o projeto à Gmail API via OAuth 2.0.

## 1. Criar projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto (ex: `email-material-requests`).
3. Ative a **Gmail API** em **APIs & Services** → **Library**.

## 2. Configurar tela de consentimento OAuth

1. **APIs & Services** → **OAuth consent screen**.
2. Tipo: **External** (para conta Gmail pessoal) ou **Internal** (Google Workspace).
3. Preencha nome do app e e-mail de suporte.
4. Adicione o escopo: `https://www.googleapis.com/auth/gmail.readonly`.
5. Adicione seu e-mail como **Test user** (modo de teste).

## 3. Criar credenciais OAuth

1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
2. Tipo: **Web application**.
3. Nome: `email-material-requests-local`.
4. **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/gmail/callback
   ```
5. Copie **Client ID** e **Client Secret**.

## 4. Configurar o `.env`

```env
GMAIL_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=seu-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/gmail/callback
GMAIL_USER_EMAIL=seu-email@gmail.com
```

> `GMAIL_REFRESH_TOKEN` será obtido no passo 5.

## 5. Obter o refresh token (uma vez)

> **Se aparecer `Cannot GET /auth/gmail`:** a porta 3000 está com um servidor antigo.
> Pare com `Ctrl+C`, ou no Windows: `netstat -ano | findstr :3000` → `taskkill /PID <pid> /F`.
> Depois rode `npm run dev` novamente.

```bash
docker compose up -d
cp .env.example .env   # se ainda não tiver
npm run dev
```

1. Abra no navegador: [http://localhost:3000/auth/gmail](http://localhost:3000/auth/gmail)
2. Faça login com a conta Gmail que receberá os pedidos.
3. Autorize o acesso.
4. Na página de sucesso, copie o `GMAIL_REFRESH_TOKEN` para o `.env`.
5. Reinicie o servidor (`npm run dev`).

## 6. Testar leitura de e-mails

```bash
GET http://localhost:3000/gmail/messages/unread
GET http://localhost:3000/gmail/messages/unread?maxResults=5
```

Resposta esperada:

```json
{
  "total": 1,
  "messages": [
    {
      "gmailMessageId": "...",
      "subject": "Solicitação de material",
      "sender": "joao@empresa.com",
      "body": "...",
      "receivedAt": "..."
    }
  ]
}
```

## Fluxo OAuth (como funciona)

```
Você → GET /auth/gmail
     → redirect Google (login + consentimento)
     → GET /auth/gmail/callback?code=...
     → troca code por tokens
     → exibe refresh_token para colar no .env

App (depois) → usa refresh_token
            → obtém access_token automaticamente
            → chama Gmail API
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/auth/gmail` | Inicia fluxo OAuth |
| `GET` | `/auth/gmail/callback` | Callback do Google |
| `GET` | `/gmail/messages/unread` | Lista e-mails não lidos (teste) |

## Custos

Gmail API é **gratuita** dentro das quotas de uso para este projeto.

## Próximo passo

Task 4/7: o worker vai chamar `gmailService.listUnreadMessages()` e passar o resultado para `pedidoService.processarEmail()`.
