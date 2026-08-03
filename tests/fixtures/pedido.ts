import type { EmailMessage, ParsedPedidoData } from '../../src/types/email.js';
import type { Pedido, PedidoItem } from '../../src/types/entities.js';
import { ParserType, PedidoStatus, UrgencyLevel } from '../../src/types/enums.js';

export const emailRecebido: EmailMessage = {
  gmailMessageId: 'gmail-msg-001',
  threadId: 'thread-abc',
  subject: 'Solicitação de material - Obra 42',
  sender: 'joao.silva@empresa.com',
  receivedAt: new Date('2026-07-30T12:00:00.000Z'),
  body: `
    Olá,

    Preciso dos seguintes materiais para a obra 42:
    - 10 parafusos M8
    - 5 metros de cabo PP 2,5mm

    Att,
    João Silva
    Departamento: Manutenção
  `,
};

export const dadosExtraidosDoEmail: ParsedPedidoData = {
  solicitanteNome: 'João Silva',
  solicitanteEmail: 'joao.silva@empresa.com',
  departamento: 'Manutenção',
  urgencia: UrgencyLevel.MEDIUM,
  observacoes: 'Obra 42',
  parserTipo: ParserType.REGEX,
  parserConfianca: 0.95,
  itens: [
    {
      materialCodigo: 'PAR-M8',
      materialDescricao: 'Parafuso M8',
      quantidade: 10,
      unidade: 'un',
    },
    {
      materialDescricao: 'Cabo PP 2,5mm',
      quantidade: 5,
      unidade: 'm',
    },
  ],
};

export function criarPedidoMock(overrides: Partial<Pedido> = {}): Pedido {
  return {
    id: 'pedido-uuid-001',
    gmailMessageId: emailRecebido.gmailMessageId,
    emailThreadId: emailRecebido.threadId ?? null,
    emailSubject: emailRecebido.subject ?? null,
    emailSender: emailRecebido.sender,
    emailReceivedAt: emailRecebido.receivedAt,
    solicitanteNome: dadosExtraidosDoEmail.solicitanteNome ?? null,
    solicitanteEmail: dadosExtraidosDoEmail.solicitanteEmail ?? null,
    departamento: dadosExtraidosDoEmail.departamento ?? null,
    urgencia: dadosExtraidosDoEmail.urgencia ?? null,
    observacoes: dadosExtraidosDoEmail.observacoes ?? null,
    status: PedidoStatus.PROCESSING,
    parserTipo: ParserType.REGEX,
    parserConfianca: 0.95,
    erroMensagem: null,
    processadoEm: null,
    createdAt: new Date('2026-07-30T12:00:01.000Z'),
    updatedAt: new Date('2026-07-30T12:00:01.000Z'),
    ...overrides,
  };
}

export function criarItensMock(pedidoId: string): PedidoItem[] {
  return dadosExtraidosDoEmail.itens.map((item, index) => ({
    id: `item-uuid-00${index + 1}`,
    pedidoId,
    materialCodigo: item.materialCodigo ?? null,
    materialDescricao: item.materialDescricao,
    quantidade: item.quantidade,
    unidade: item.unidade ?? null,
    createdAt: new Date('2026-07-30T12:00:02.000Z'),
  }));
}
