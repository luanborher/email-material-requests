import type { Env } from './env.schema.js';

export class GmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailConfigError';
  }
}

export function isGmailOAuthConfigured(gmail: Env['email']['gmail']): boolean {
  return Boolean(gmail.clientId && gmail.clientSecret);
}

export function isGmailFullyConfigured(gmail: Env['email']['gmail']): boolean {
  return Boolean(gmail.clientId && gmail.clientSecret && gmail.refreshToken);
}

export function assertGmailOAuthConfigured(gmail: Env['email']['gmail']): void {
  if (!isGmailOAuthConfigured(gmail)) {
    throw new GmailConfigError(
      'Gmail OAuth não configurado. Defina GMAIL_CLIENT_ID e GMAIL_CLIENT_SECRET no .env',
    );
  }
}

export function assertGmailFullyConfigured(gmail: Env['email']['gmail']): void {
  if (!isGmailFullyConfigured(gmail)) {
    throw new GmailConfigError(
      'Gmail não configurado. Defina GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET e GMAIL_REFRESH_TOKEN no .env',
    );
  }
}
