import { Router } from 'express';
import { parseAndSavePedido } from '../services/email-processing.service.js';
import type { EmailMessage } from '../types/email.js';

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
    const message = error instanceof Error ? error.message : 'Erro ao salvar pedido';
    res.status(500).json({ error: message });
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

  return {
    gmailMessageId:
      typeof input.gmailMessageId === 'string' ? input.gmailMessageId : `manual-${Date.now()}`,
    threadId: typeof input.threadId === 'string' ? input.threadId : null,
    subject: typeof input.subject === 'string' ? input.subject : null,
    sender: input.sender,
    receivedAt: input.receivedAt ? new Date(String(input.receivedAt)) : new Date(),
    body: input.body,
  };
}
