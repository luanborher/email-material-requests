import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config/ai.config.js', () => ({
  isAiConfigured: () => true,
}));

import { PedidoParserService } from './pedido-parser.service.js';
import { RegexPedidoParser } from './parsers/regex-pedido.parser.js';
import type { LlmPedidoParser } from './parsers/llm-pedido.parser.js';
import { ParserType } from '../types/enums.js';
import type { EmailMessage } from '../../types/email.js';

const email: EmailMessage = {
  gmailMessageId: 'test-001',
  subject: 'Pedido de material',
  sender: 'joao@empresa.com',
  receivedAt: new Date(),
  body: '- 2 tintas brancas',
};

describe('PedidoParserService', () => {
  const regexParser = new RegexPedidoParser();
  const llmParser = {
    parse: vi.fn(),
  } as unknown as LlmPedidoParser;

  const service = new PedidoParserService(regexParser, llmParser, 0.9);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usa regex quando confiança é alta o suficiente', async () => {
    const highConfidenceEmail: EmailMessage = {
      ...email,
      body: `
        Solicitação de material
        - 10 parafusos M8
        - 5 metros de cabo
        Departamento: Obras
        Urgência: alta
      `,
    };

    const result = await service.parse(highConfidenceEmail);

    expect(result.success).toBe(true);
    expect(result.data?.parserTipo).toBe(ParserType.REGEX);
    expect(llmParser.parse).not.toHaveBeenCalled();
  });

  it('chama LLM quando regex tem baixa confiança', async () => {
    llmParser.parse = vi.fn().mockResolvedValue({
      success: true,
      data: {
        solicitanteEmail: 'joao@empresa.com',
        itens: [{ materialDescricao: 'Tinta branca', quantidade: 2, unidade: 'un' }],
        parserTipo: ParserType.LLM,
        parserConfianca: 0.85,
      },
    });

    const result = await service.parse(email);

    expect(llmParser.parse).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    expect(result.data?.parserTipo).toBe(ParserType.LLM);
  });
});
