import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import { env } from '../config/env.js';
import {
  assertGmailFullyConfigured,
  assertGmailOAuthConfigured,
} from '../config/gmail.config.js';
import { GMAIL_SCOPES } from '../config/gmail.constants.js';

export interface GmailTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number | null;
  scope?: string | null;
}

export class GmailAuthService {
  createOAuth2Client() {
    assertGmailOAuthConfigured(env.email.gmail);

    return new google.auth.OAuth2(
      env.email.gmail.clientId,
      env.email.gmail.clientSecret,
      env.email.gmail.redirectUri,
    );
  }

  getAuthorizationUrl(): string {
    const client = this.createOAuth2Client();

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [...GMAIL_SCOPES],
    });
  }

  async exchangeCodeForTokens(code: string): Promise<GmailTokenResponse> {
    const client = this.createOAuth2Client();
    const { tokens } = await client.getToken(code);

    return this.mapTokens(tokens);
  }

  getAuthenticatedClient() {
    assertGmailFullyConfigured(env.email.gmail);

    const client = this.createOAuth2Client();
    client.setCredentials({
      refresh_token: env.email.gmail.refreshToken,
    });

    return client;
  }

  private mapTokens(tokens: Credentials): GmailTokenResponse {
    if (!tokens.access_token) {
      throw new Error('Google não retornou access_token');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiryDate: tokens.expiry_date ?? null,
      scope: tokens.scope ?? null,
    };
  }
}

export const gmailAuthService = new GmailAuthService();
