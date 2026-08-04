import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PedidoService } from '../../src/services/pedido/pedido.service.js';
import { PedidoStatus } from '../../src/types/enums.js';
import {
  criarItensMock,
  criarPedidoMock,
  dadosExtraidosDoEmail,
  emailRecebido,
} from '../fixtures/pedido.js';

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

describe('PedidoService.processarEmail', () => {
  const mocks = criarMocks();
  const service = new PedidoService(mocks.pedidos, mocks.pedidoItens);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria pedido completo quando recebe um e-mail novo', async () => {
    const pedidoEmProcessamento = criarPedidoMock({ status: PedidoStatus.PROCESSING });
    const pedidoConcluido = criarPedidoMock({ status: PedidoStatus.COMPLETED });
    const itensSalvos = criarItensMock(pedidoEmProcessamento.id);

    mocks.pedidos.findByGmailMessageId.mockResolvedValue(null);
    mocks.pedidos.create.mockResolvedValue(pedidoEmProcessamento);
    mocks.pedidoItens.createMany.mockResolvedValue(itensSalvos);
    mocks.pedidos.updateStatus.mockResolvedValue(pedidoConcluido);

    const resultado = await service.processarEmail(emailRecebido, dadosExtraidosDoEmail);

    expect(resultado.skipped).toBe(false);
    expect(resultado.pedido.status).toBe(PedidoStatus.COMPLETED);
    expect(resultado.itens).toHaveLength(2);
    expect(resultado.itens[0].materialDescricao).toBe('Parafuso M8');

    expect(mocks.pedidos.findByGmailMessageId).toHaveBeenCalledWith('gmail-msg-001');
    expect(mocks.pedidos.create).toHaveBeenCalledOnce();
    expect(mocks.pedidoItens.createMany).toHaveBeenCalledOnce();
    expect(mocks.pedidos.updateStatus).toHaveBeenCalledWith(
      pedidoEmProcessamento.id,
      expect.objectContaining({ status: PedidoStatus.COMPLETED }),
    );

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
