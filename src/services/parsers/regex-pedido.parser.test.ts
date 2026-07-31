import { describe, expect, it } from 'vitest';
import { RegexPedidoParser } from './regex-pedido.parser.js';
import { ParserType, UrgencyLevel } from '../../types/enums.js';
import type { EmailMessage } from '../../types/email.js';

const parser = new RegexPedidoParser();

const emailPedido: EmailMessage = {
  gmailMessageId: 'test-001',
  subject: 'Solicitação de material - Obra 42',
  sender: 'joao.silva@empresa.com',
  receivedAt: new Date('2026-07-30T12:00:00.000Z'),
  body: `
    Olá,

    Preciso dos seguintes materiais:
    - 10 parafusos M8
    - 5 metros de cabo PP 2,5mm

    Departamento: Manutenção
    Urgência: alta
    Obra: 42

    Att,
    João
  `,
};

describe('RegexPedidoParser', () => {
  it('extrai itens e metadados de e-mail estruturado', () => {
    const result = parser.parse(emailPedido);

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
      ...emailPedido,
      body: 'Olá, tudo bem? Sem pedido aqui.',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Nenhum item encontrado');
  });
});
