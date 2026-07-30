import type { PedidoItemRepository } from '../repositories/pedido-item.repository.js';
import type { PedidoRepository } from '../repositories/pedido.repository.js';
import type {
  EmailMessage,
  ParsedPedidoData,
  ProcessarPedidoResult,
} from '../types/email.js';
import { PedidoStatus } from '../types/enums.js';

export class PedidoService {
  constructor(
    private readonly pedidos: PedidoRepository,
    private readonly pedidoItens: PedidoItemRepository,
  ) {}

  async processarEmail(email: EmailMessage, dados: ParsedPedidoData): Promise<ProcessarPedidoResult> {
    const existente = await this.pedidos.findByGmailMessageId(email.gmailMessageId);

    if (existente) {
      return { pedido: existente, itens: [], skipped: true };
    }

    const pedido = await this.pedidos.create({
      gmailMessageId: email.gmailMessageId,
      emailThreadId: email.threadId,
      emailSubject: email.subject,
      emailSender: email.sender,
      emailReceivedAt: email.receivedAt,
      solicitanteNome: dados.solicitanteNome,
      solicitanteEmail: dados.solicitanteEmail,
      departamento: dados.departamento,
      urgencia: dados.urgencia,
      observacoes: dados.observacoes,
      status: PedidoStatus.PROCESSING,
      parserTipo: dados.parserTipo,
      parserConfianca: dados.parserConfianca,
    });

    try {
      const itens = await this.pedidoItens.createMany(
        dados.itens.map((item) => ({
          pedidoId: pedido.id,
          materialCodigo: item.materialCodigo,
          materialDescricao: item.materialDescricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
        })),
      );

      const pedidoAtualizado = await this.pedidos.updateStatus(pedido.id, {
        status: PedidoStatus.COMPLETED,
        parserTipo: dados.parserTipo,
        parserConfianca: dados.parserConfianca,
      });

      return {
        pedido: pedidoAtualizado ?? pedido,
        itens,
        skipped: false,
      };
    } catch (error) {
      await this.pedidos.updateStatus(pedido.id, {
        status: PedidoStatus.FAILED,
        parserTipo: dados.parserTipo,
        parserConfianca: dados.parserConfianca,
        erroMensagem: error instanceof Error ? error.message : 'Erro desconhecido',
      });

      throw error;
    }
  }
}
