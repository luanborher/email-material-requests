import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/config/ai.config.js', () => ({
  isAiConfigured: () => true,
}));

import { PedidoParserService } from '../../src/services/pedido-parser.service.js';
import { RegexPedidoParser } from '../../src/services/parsers/regex-pedido.parser.js';
import type { LlmPedidoParser } from '../../src/services/parsers/llm-pedido.parser.js';
import { ParserType } from '../../src/types/enums.js';
import { emailPedidoSimples } from '../fixtures/email.js';

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
    const highConfidenceEmail = {
      ...emailPedidoSimples,
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

    const result = await service.parse(emailPedidoSimples);

    expect(llmParser.parse).toHaveBeenCalledOnce();
    expect(result.success).toBe(true);
    expect(result.data?.parserTipo).toBe(ParserType.LLM);
  });
});
