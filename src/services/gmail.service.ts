import { google } from 'googleapis';
import type { GmailAuthService } from './gmail-auth.service.js';
import type { EmailMessage } from '../types/email.js';
import { mapGmailMessageToEmailMessage } from '../utils/gmail-message.parser.js';
import { gmailAuthService } from './gmail-auth.service.js';

export class GmailService {
  constructor(private readonly authService: GmailAuthService) {}

  async listUnreadMessageIds(maxResults = 10): Promise<string[]> {
    const gmail = this.getGmailClient();
    const userId = this.getUserId();

    const response = await gmail.users.messages.list({
      userId,
      maxResults,
      q: 'is:unread in:inbox',
    });

    return (response.data.messages ?? [])
      .map((message) => message.id)
      .filter((id): id is string => Boolean(id));
  }

  async getMessage(gmailMessageId: string): Promise<EmailMessage> {
    const gmail = this.getGmailClient();
    const userId = this.getUserId();

    const response = await gmail.users.messages.get({
      userId,
      id: gmailMessageId,
      format: 'full',
    });

    if (!response.data.id) {
      throw new Error(`Mensagem ${gmailMessageId} não encontrada`);
    }

    return mapGmailMessageToEmailMessage(response.data);
  }

  async listUnreadMessages(maxResults = 10): Promise<EmailMessage[]> {
    const messageIds = await this.listUnreadMessageIds(maxResults);

    return Promise.all(messageIds.map((id) => this.getMessage(id)));
  }

  private getGmailClient() {
    return google.gmail({
      version: 'v1',
      auth: this.authService.getAuthenticatedClient(),
    });
  }

  private getUserId(): string {
    return 'me';
  }
}

export const gmailService = new GmailService(gmailAuthService);
