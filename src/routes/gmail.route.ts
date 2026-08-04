import { Router } from 'express';
import {
  DEFAULT_GMAIL_MESSAGES_PER_REQUEST,
  MAX_GMAIL_MESSAGES_PER_REQUEST,
} from '../config/gmail.constants.js';
import { GmailConfigError } from '../config/gmail.config.js';
import { parseAndSavePedido } from '../services/worker/email-processing.service.js';
import { gmailService } from '../services/gmail/gmail.service.js';
import { getErrorMessage } from '../utils/error.js';

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

    res.status(500).json({ error: getErrorMessage(error, 'Erro ao listar e-mails') });
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

    res.status(500).json({ error: getErrorMessage(error, 'Erro ao processar e-mail') });
  }
});

function parseMaxResults(value: unknown): number {
  if (typeof value !== 'string') {
    return DEFAULT_GMAIL_MESSAGES_PER_REQUEST;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_GMAIL_MESSAGES_PER_REQUEST) {
    return DEFAULT_GMAIL_MESSAGES_PER_REQUEST;
  }

  return parsed;
}
