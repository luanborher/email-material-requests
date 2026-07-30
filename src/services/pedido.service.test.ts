import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PedidoService } from './pedido.service.js';
import type { EmailMessage, ParsedPedidoData } from '../types/email.js';
import type { Pedido, PedidoItem } from '../types/entities.js';
import { ParserType, PedidoStatus, UrgencyLevel } from '../types/enums.js';

// ---------------------------------------------------------------------------
// Fixtures — simulam o que viria do Gmail e do parser (regex/LLM)
// ---------------------------------------------------------------------------

const emailRecebido: EmailMessage = {
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

const dadosExtraidosDoEmail: ParsedPedidoData = {
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

function criarPedidoMock(overrides: Partial<Pedido> = {}): Pedido {
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

function criarItensMock(pedidoId: string): PedidoItem[] {
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

// ---------------------------------------------------------------------------
// Mocks dos repositories — sem banco real
// ---------------------------------------------------------------------------

function criarMocks() {
  return {
    pedidos: {
      findByGmailMessageId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
    },
    pedidoItens: {
      createMany: vi.fn(),
    },
  };
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('PedidoService.processarEmail', () => {
  const mocks = criarMocks();
  const service = new PedidoService(mocks.pedidos, mocks.pedidoItens);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria pedido completo quando recebe um e-mail novo', async () => {
    // Arrange — simula leitura do Gmail + parser
    const pedidoEmProcessamento = criarPedidoMock({ status: PedidoStatus.PROCESSING });
    const pedidoConcluido = criarPedidoMock({ status: PedidoStatus.COMPLETED });
    const itensSalvos = criarItensMock(pedidoEmProcessamento.id);

    mocks.pedidos.findByGmailMessageId.mockResolvedValue(null);
    mocks.pedidos.create.mockResolvedValue(pedidoEmProcessamento);
    mocks.pedidoItens.createMany.mockResolvedValue(itensSalvos);
    mocks.pedidos.updateStatus.mockResolvedValue(pedidoConcluido);

    // Act — orquestra o fluxo como o worker fará no futuro
    const resultado = await service.processarEmail(emailRecebido, dadosExtraidosDoEmail);

    // Assert — pedido criado com dados corretos
    expect(resultado.skipped).toBe(false);
    expect(resultado.pedido.status).toBe(PedidoStatus.COMPLETED);
    expect(resultado.itens).toHaveLength(2);
    expect(resultado.itens[0].materialDescricao).toBe('Parafuso M8');

    // Verifica ordem do pipeline
    expect(mocks.pedidos.findByGmailMessageId).toHaveBeenCalledWith('gmail-msg-001');
    expect(mocks.pedidos.create).toHaveBeenCalledOnce();
    expect(mocks.pedidoItens.createMany).toHaveBeenCalledOnce();
    expect(mocks.pedidos.updateStatus).toHaveBeenCalledWith(
      pedidoEmProcessamento.id,
      expect.objectContaining({ status: PedidoStatus.COMPLETED }),
    );

    // Dados do e-mail repassados ao repository
    expect(mocks.pedidos.create).toHaveBeenCalledWith(
      expect.objectContaining({
        gmailMessageId: 'gmail-msg-001',
        emailSender: 'joao.silva@empresa.com',
        solicitanteNome: 'João Silva',
        status: PedidoStatus.PROCESSING,
      }),
    );
  });

  it('não duplica pedido quando o e-mail já foi processado (idempotência)', async () => {
    const pedidoExistente = criarPedidoMock({ status: PedidoStatus.COMPLETED });

    mocks.pedidos.findByGmailMessageId.mockResolvedValue(pedidoExistente);

    const resultado = await service.processarEmail(emailRecebido, dadosExtraidosDoEmail);

    expect(resultado.skipped).toBe(true);
    expect(resultado.pedido).toBe(pedidoExistente);
    expect(mocks.pedidos.create).not.toHaveBeenCalled();
    expect(mocks.pedidoItens.createMany).not.toHaveBeenCalled();
  });

  it('marca pedido como failed quando falha ao salvar itens', async () => {
    const pedidoEmProcessamento = criarPedidoMock({ status: PedidoStatus.PROCESSING });

    mocks.pedidos.findByGmailMessageId.mockResolvedValue(null);
    mocks.pedidos.create.mockResolvedValue(pedidoEmProcessamento);
    mocks.pedidoItens.createMany.mockRejectedValue(new Error('Falha na transaction'));
    mocks.pedidos.updateStatus.mockResolvedValue(
      criarPedidoMock({ status: PedidoStatus.FAILED, erroMensagem: 'Falha na transaction' }),
    );

    await expect(
      service.processarEmail(emailRecebido, dadosExtraidosDoEmail),
    ).rejects.toThrow('Falha na transaction');

    expect(mocks.pedidos.updateStatus).toHaveBeenCalledWith(
      pedidoEmProcessamento.id,
      expect.objectContaining({
        status: PedidoStatus.FAILED,
        erroMensagem: 'Falha na transaction',
      }),
    );
  });
});
