import { describe, expect, it } from 'vitest';
import { RegexPedidoParser } from '../../../src/services/parser/regex-pedido.parser.js';
import { ParserType, UrgencyLevel } from '../../../src/types/enums.js';
import { emailPedidoEstruturado } from '../../fixtures/email.js';

const parser = new RegexPedidoParser();

describe('RegexPedidoParser', () => {
  it('extrai itens e metadados de e-mail estruturado', () => {
    const result = parser.parse(emailPedidoEstruturado);

    expect(result.success).toBe(true);
    expect(result.data?.parserTipo).toBe(ParserType.REGEX);
    expect(result.data?.itens).toHaveLength(2);
    expect(result.data?.itens[0].materialDescricao).toContain('parafusos M8');
    expect(result.data?.itens[0].quantidade).toBe(10);
    expect(result.data?.departamento).toBe('Manutenção');
    expect(result.data?.urgencia).toBe(UrgencyLevel.HIGH);
    expect(result.data?.observacoes).toBe('42');
    expect(result.data?.parserConfianca).toBeGreaterThanOrEqual(0.7);
  });

  it('falha quando não encontra itens', () => {
    const result = parser.parse({
      ...emailPedidoEstruturado,
      body: 'Olá, tudo bem? Sem pedido aqui.',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Nenhum item encontrado');
  });
});
