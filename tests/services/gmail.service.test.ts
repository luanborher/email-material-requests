import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GmailService } from '../../src/services/gmail/gmail.service.js';
import type { GmailAuthService } from '../../src/services/gmail/gmail-auth.service.js';

const getMock = vi.fn();
const listMock = vi.fn();

vi.mock('googleapis', () => ({
  google: {
    gmail: vi.fn(() => ({
      users: {
        messages: {
          list: listMock,
          get: getMock,
        },
      },
    })),
  },
}));

describe('GmailService', () => {
  const authService = {
    getAuthenticatedClient: vi.fn(() => ({})),
  } as unknown as GmailAuthService;

  const service = new GmailService(authService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista mensagens não lidas da inbox', async () => {
    listMock.mockResolvedValue({
      data: {
        messages: [{ id: 'msg-1' }, { id: 'msg-2' }],
      },
    });

    getMock
      .mockResolvedValueOnce({
        data: {
          id: 'msg-1',
          threadId: 'thread-1',
          internalDate: '1722345600000',
          payload: {
            headers: [
              { name: 'From', value: 'joao@empresa.com' },
              { name: 'Subject', value: 'Pedido 1' },
            ],
            body: { data: Buffer.from('Corpo 1', 'utf-8').toString('base64') },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'msg-2',
          threadId: 'thread-2',
          internalDate: '1722345601000',
          payload: {
            headers: [
              { name: 'From', value: 'maria@empresa.com' },
              { name: 'Subject', value: 'Pedido 2' },
            ],
            body: { data: Buffer.from('Corpo 2', 'utf-8').toString('base64') },
          },
        },
      });

    const messages = await service.listUnreadMessages(2);

    expect(listMock).toHaveBeenCalledWith({
      userId: 'me',
      maxResults: 2,
      q: 'is:unread in:inbox',
    });
    expect(messages).toHaveLength(2);
    expect(messages[0].gmailMessageId).toBe('msg-1');
    expect(messages[1].subject).toBe('Pedido 2');
  });
});
