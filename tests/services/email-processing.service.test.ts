import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailMessage, ParsedPedidoData } from '../../src/types/email.js';
import { ParserType } from '../../src/types/enums.js';

vi.mock('../../src/services/parser/pedido-parser.service.js', () => ({
  pedidoParserService: {
    parse: vi.fn(),
  },
}));

vi.mock('../../src/services/pedido/pedido.service.instance.js', () => ({
  pedidoService: {
    processarEmail: vi.fn(),
  },
}));

import { parseAndSavePedido } from '../../src/services/worker/email-processing.service.js';
import { pedidoParserService } from '../../src/services/parser/pedido-parser.service.js';
import { pedidoService } from '../../src/services/pedido/pedido.service.instance.js';

const email: EmailMessage = {
  gmailMessageId: 'msg-001',
  sender: 'teste@empresa.com',
  receivedAt: new Date('2026-07-30T12:00:00.000Z'),
  body: '- 10 parafusos M8',
};

const dadosParseados: ParsedPedidoData = {
  solicitanteEmail: 'teste@empresa.com',
  itens: [{ materialDescricao: 'parafusos M8', quantidade: 10 }],
  parserTipo: ParserType.REGEX,
  parserConfianca: 0.9,
};

describe('parseAndSavePedido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('salva no banco quando o parse é bem-sucedido', async () => {
    vi.mocked(pedidoParserService.parse).mockResolvedValue({
      success: true,
      data: dadosParseados,
    });
    vi.mocked(pedidoService.processarEmail).mockResolvedValue({
      pedido: { id: 'pedido-1' } as never,
      itens: [],
      skipped: false,
    });

    const result = await parseAndSavePedido(email);

    expect(pedidoService.processarEmail).toHaveBeenCalledWith(email, dadosParseados);
    expect(result.parsed.success).toBe(true);
    expect(result.saved?.skipped).toBe(false);
  });

  it('não salva quando o parse falha', async () => {
    vi.mocked(pedidoParserService.parse).mockResolvedValue({
      success: false,
      error: 'Nenhum item encontrado',
    });

    const result = await parseAndSavePedido(email);

    expect(pedidoService.processarEmail).not.toHaveBeenCalled();
    expect(result.saved).toBeUndefined();
    expect(result.parsed.success).toBe(false);
  });
});
