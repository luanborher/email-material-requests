import { google, type gmail_v1 } from 'googleapis';
import type { GmailAuthService } from './gmail-auth.service.js';
import type { EmailMessage } from '../types/email.js';
import { mapGmailMessageToEmailMessage } from '../utils/gmail-message.parser.js';
import { gmailAuthService } from './gmail-auth.service.js';

export class GmailService {
  private gmailClient: gmail_v1.Gmail | null = null;

  constructor(private readonly authService: GmailAuthService) {}

  async listUnreadMessageIds(maxResults = 10): Promise<string[]> {
    const gmail = this.getGmailClient();

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'is:unread in:inbox',
    });

    return (response.data.messages ?? [])
      .map((message) => message.id)
      .filter((id): id is string => Boolean(id));
  }

  async getMessage(gmailMessageId: string): Promise<EmailMessage> {
    const gmail = this.getGmailClient();

    const response = await gmail.users.messages.get({
      userId: 'me',
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

  async markAsRead(gmailMessageId: string): Promise<void> {
    const gmail = this.getGmailClient();

    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }

  private getGmailClient(): gmail_v1.Gmail {
    if (!this.gmailClient) {
      this.gmailClient = google.gmail({
        version: 'v1',
        auth: this.authService.getAuthenticatedClient(),
      });
    }

    return this.gmailClient;
  }
}

export const gmailService = new GmailService(gmailAuthService);
