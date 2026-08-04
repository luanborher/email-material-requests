import { Router } from 'express';
import { parseAndSavePedido } from '../services/worker/email-processing.service.js';
import type { EmailMessage } from '../types/email.js';
import { getErrorMessage } from '../utils/error.js';

export const parserRouter = Router();

parserRouter.post('/parse', async (req, res) => {
  const email = parseEmailFromBody(req.body);

  if (!email) {
    res.status(400).json({
      error: 'Corpo inválido. Envie: subject, sender, body (e opcionalmente gmailMessageId)',
    });
    return;
  }

  try {
    const { parsed, saved } = await parseAndSavePedido(email);

    if (!parsed.success) {
      res.status(422).json(parsed);
      return;
    }

    res.json({ ...parsed, saved });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Erro ao salvar pedido') });
  }
});

function parseEmailFromBody(body: unknown): EmailMessage | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const input = body as Record<string, unknown>;

  if (typeof input.sender !== 'string' || typeof input.body !== 'string') {
    return null;
  }

  const receivedAt = parseReceivedAt(input.receivedAt);

  return {
    gmailMessageId:
      typeof input.gmailMessageId === 'string'
        ? input.gmailMessageId
        : `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    threadId: typeof input.threadId === 'string' ? input.threadId : null,
    subject: typeof input.subject === 'string' ? input.subject : null,
    sender: input.sender,
    receivedAt,
    body: input.body,
  };
}

function parseReceivedAt(value: unknown): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}
