import type { gmail_v1 } from 'googleapis';
import type { EmailMessage } from '../types/email.js';

export function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf-8');
}

export function getHeaderValue(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string {
  const header = headers?.find(
    (item) => item.name?.toLowerCase() === name.toLowerCase(),
  );

  return header?.value ?? '';
}

export function parseSenderEmail(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match?.[1] ?? fromHeader).trim();
}

export function extractMessageBody(
  payload: gmail_v1.Schema$MessagePart | undefined,
): string {
  if (!payload) {
    return '';
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (!payload.parts?.length) {
    return '';
  }

  const plainTextPart = findPartByMimeType(payload.parts, 'text/plain');
  if (plainTextPart?.body?.data) {
    return decodeBase64Url(plainTextPart.body.data);
  }

  const htmlPart = findPartByMimeType(payload.parts, 'text/html');
  if (htmlPart?.body?.data) {
    return decodeBase64Url(htmlPart.body.data);
  }

  return '';
}

function findPartByMimeType(
  parts: gmail_v1.Schema$MessagePart[],
  mimeType: string,
): gmail_v1.Schema$MessagePart | undefined {
  for (const part of parts) {
    if (part.mimeType === mimeType) {
      return part;
    }

    if (part.parts?.length) {
      const nested = findPartByMimeType(part.parts, mimeType);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

export function mapGmailMessageToEmailMessage(
  message: gmail_v1.Schema$Message,
): EmailMessage {
  const headers = message.payload?.headers;
  const fromHeader = getHeaderValue(headers, 'From');
  const receivedAt = message.internalDate
    ? new Date(Number(message.internalDate))
    : new Date();

  return {
    gmailMessageId: message.id ?? '',
    threadId: message.threadId ?? null,
    subject: getHeaderValue(headers, 'Subject') || null,
    sender: parseSenderEmail(fromHeader),
    receivedAt,
    body: extractMessageBody(message.payload),
  };
}
