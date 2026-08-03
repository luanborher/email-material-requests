import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailMessage } from '../types/email.js';
import { EmailWorkerService } from './email-worker.service.js';
import type { GmailService } from './gmail.service.js';

vi.mock('./email-processing.service.js', () => ({
  parseAndSavePedido: vi.fn(),
}));

import { parseAndSavePedido } from './email-processing.service.js';

const email: EmailMessage = {
  gmailMessageId: 'msg-001',
  sender: 'joao@empresa.com',
  receivedAt: new Date(),
  body: '- 10 parafusos',
};

describe('EmailWorkerService', () => {
  const gmailService = {
    listUnreadMessageIds: vi.fn(),
    getMessage: vi.fn(),
    markAsRead: vi.fn(),
  } as unknown as GmailService;

  const worker = new EmailWorkerService(gmailService, 60_000, 10);

  beforeEach(() => {
    vi.clearAllMocks();
    worker.stop();
  });

  it('processa e-mails não lidos e marca como lido', async () => {
    vi.mocked(gmailService.listUnreadMessageIds).mockResolvedValue(['msg-001']);
    vi.mocked(gmailService.getMessage).mockResolvedValue(email);
    vi.mocked(parseAndSavePedido).mockResolvedValue({
      parsed: { success: true, data: { itens: [], parserTipo: 'regex', parserConfianca: 0.9 } },
      saved: { pedido: { id: 'p1' } as never, itens: [], skipped: false },
    });

    const result = await worker.runCycle();

    expect(result.processed).toBe(1);
    expect(gmailService.markAsRead).toHaveBeenCalledWith('msg-001');
  });

  it('conta como ignorado quando pedido já existe', async () => {
    vi.mocked(gmailService.listUnreadMessageIds).mockResolvedValue(['msg-001']);
    vi.mocked(gmailService.getMessage).mockResolvedValue(email);
    vi.mocked(parseAndSavePedido).mockResolvedValue({
      parsed: { success: true, data: { itens: [], parserTipo: 'regex', parserConfianca: 0.9 } },
      saved: { pedido: { id: 'p1' } as never, itens: [], skipped: true },
    });

    const result = await worker.runCycle();

    expect(result.skipped).toBe(1);
    expect(gmailService.markAsRead).toHaveBeenCalledWith('msg-001');
  });

  it('não marca como lido quando parse falha', async () => {
    vi.mocked(gmailService.listUnreadMessageIds).mockResolvedValue(['msg-001']);
    vi.mocked(gmailService.getMessage).mockResolvedValue(email);
    vi.mocked(parseAndSavePedido).mockResolvedValue({
      parsed: { success: false, error: 'Nenhum item encontrado' },
    });

    const result = await worker.runCycle();

    expect(result.failed).toBe(1);
    expect(gmailService.markAsRead).not.toHaveBeenCalled();
  });
});
