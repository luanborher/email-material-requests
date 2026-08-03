import { Router } from 'express';
import { gmailAuthService } from '../services/gmail-auth.service.js';
import { GmailConfigError } from '../config/gmail.config.js';
import { escapeHtml, getErrorMessage } from '../utils/error.js';

export const gmailAuthRouter = Router();

gmailAuthRouter.get('/', (_req, res) => {
  try {
    const authorizationUrl = gmailAuthService.getAuthorizationUrl();
    res.redirect(authorizationUrl);
  } catch (error) {
    if (error instanceof GmailConfigError) {
      res.status(503).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: getErrorMessage(error, 'Erro ao iniciar OAuth') });
  }
});

gmailAuthRouter.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (typeof code !== 'string') {
    res.status(400).json({ error: 'Parâmetro "code" ausente no callback do Google' });
    return;
  }

  try {
    const tokens = await gmailAuthService.exchangeCodeForTokens(code);

    if (!tokens.refreshToken) {
      res.status(400).send(renderCallbackPage({
        success: false,
        message:
          'O Google não retornou refresh_token. Revogue o acesso em myaccount.google.com/permissions e tente novamente com prompt=consent.',
      }));
      return;
    }

    res.status(200).send(renderCallbackPage({
      success: true,
      refreshToken: tokens.refreshToken,
      scope: tokens.scope ?? undefined,
    }));
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Erro ao trocar código OAuth') });
  }
});

function renderCallbackPage(input: {
  success: boolean;
  refreshToken?: string;
  scope?: string;
  message?: string;
}): string {
  if (!input.success) {
    return `
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h1>OAuth Gmail — erro</h1>
          <p>${escapeHtml(input.message ?? 'Erro desconhecido')}</p>
        </body>
      </html>
    `;
  }

  return `
    <html>
      <body style="font-family: sans-serif; padding: 2rem; max-width: 720px;">
        <h1>OAuth Gmail — sucesso</h1>
        <p>Copie o <strong>GMAIL_REFRESH_TOKEN</strong> abaixo para o seu arquivo <code>.env</code>:</p>
        <pre style="background: #f4f4f4; padding: 1rem; overflow-x: auto;">GMAIL_REFRESH_TOKEN=${escapeHtml(input.refreshToken ?? '')}</pre>
        ${input.scope ? `<p><strong>Scope:</strong> ${escapeHtml(input.scope)}</p>` : ''}
        <p>Reinicie o servidor após salvar o <code>.env</code>.</p>
      </body>
    </html>
  `;
}
