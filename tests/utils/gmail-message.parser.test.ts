import { describe, expect, it } from 'vitest';
import type { gmail_v1 } from 'googleapis';
import {
  decodeBase64Url,
  extractMessageBody,
  getHeaderValue,
  mapGmailMessageToEmailMessage,
  parseSenderEmail,
} from '../../src/utils/gmail-message.parser.js';

describe('gmail-message.parser', () => {
  it('decodifica conteúdo base64url', () => {
    const encoded = Buffer.from('Olá, pedido de material', 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(decodeBase64Url(encoded)).toBe('Olá, pedido de material');
  });

  it('extrai e-mail do remetente com nome', () => {
    expect(parseSenderEmail('João Silva <joao.silva@empresa.com>')).toBe(
      'joao.silva@empresa.com',
    );
  });

  it('mapeia mensagem do Gmail para EmailMessage', () => {
    const body = 'Preciso de 10 parafusos M8';
    const encodedBody = Buffer.from(body, 'utf-8').toString('base64');

    const gmailMessage: gmail_v1.Schema$Message = {
      id: 'gmail-msg-123',
      threadId: 'thread-abc',
      internalDate: '1722345600000',
      payload: {
        headers: [
          { name: 'From', value: 'João Silva <joao.silva@empresa.com>' },
          { name: 'Subject', value: 'Solicitação de material' },
        ],
        body: {
          data: encodedBody,
        },
      },
    };

    const email = mapGmailMessageToEmailMessage(gmailMessage);

    expect(email.gmailMessageId).toBe('gmail-msg-123');
    expect(email.threadId).toBe('thread-abc');
    expect(email.subject).toBe('Solicitação de material');
    expect(email.sender).toBe('joao.silva@empresa.com');
    expect(email.body).toBe(body);
    expect(email.receivedAt).toEqual(new Date(1722345600000));
  });

  it('prioriza text/plain em mensagens multipart', () => {
    const plain = 'Texto simples';
    const html = '<p>HTML</p>';

    const payload: gmail_v1.Schema$MessagePart = {
      mimeType: 'multipart/alternative',
      parts: [
        {
          mimeType: 'text/plain',
          body: { data: Buffer.from(plain, 'utf-8').toString('base64') },
        },
        {
          mimeType: 'text/html',
          body: { data: Buffer.from(html, 'utf-8').toString('base64') },
        },
      ],
    };

    expect(extractMessageBody(payload)).toBe(plain);
    expect(getHeaderValue(payload.headers, 'Subject')).toBe('');
  });
});
