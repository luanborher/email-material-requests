import { Router } from 'express';
import { GmailConfigError } from '../config/gmail.config.js';
import { parseAndSavePedido } from '../services/email-processing.service.js';
import { gmailService } from '../services/gmail.service.js';

export const gmailRouter = Router();

gmailRouter.get('/messages/unread', async (req, res) => {
  try {
    const maxResults = parseMaxResults(req.query.maxResults);
    const messages = await gmailService.listUnreadMessages(maxResults);

    res.json({
      total: messages.length,
      messages,
    });
  } catch (error) {
    if (error instanceof GmailConfigError) {
      res.status(503).json({ error: error.message });
      return;
    }

    const message = error instanceof Error ? error.message : 'Erro ao listar e-mails';
    res.status(500).json({ error: message });
  }
});

gmailRouter.get('/messages/:messageId/parse', async (req, res) => {
  try {
    const email = await gmailService.getMessage(req.params.messageId);
    const { parsed, saved } = await parseAndSavePedido(email);

    if (!parsed.success) {
      res.status(422).json({ email, parsed });
      return;
    }

    res.json({ email, parsed, saved });
  } catch (error) {
    if (error instanceof GmailConfigError) {
      res.status(503).json({ error: error.message });
      return;
    }

    const message = error instanceof Error ? error.message : 'Erro ao processar e-mail';
    res.status(500).json({ error: message });
  }
});

function parseMaxResults(value: unknown): number {
  if (typeof value !== 'string') {
    return 10;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 50) {
    return 10;
  }

  return parsed;
}
