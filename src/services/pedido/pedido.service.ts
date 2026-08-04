import {
  toCreatePedidoInput,
  toCreatePedidoItemInputs,
} from '../../database/mappers/pedido-input.mapper.js';
import type { PedidoItemRepository } from '../../repositories/pedido-item.repository.js';
import type { PedidoRepository } from '../../repositories/pedido.repository.js';
import type {
  EmailMessage,
  ParsedPedidoData,
  ProcessarPedidoResult,
} from '../../types/email.js';
import { PedidoStatus } from '../../types/enums.js';
import { isUniqueConstraintError } from '../../utils/db-error.js';

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

    try {
      return await this.criarPedidoCompleto(email, dados);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicado = await this.pedidos.findByGmailMessageId(email.gmailMessageId);

        if (duplicado) {
          return { pedido: duplicado, itens: [], skipped: true };
        }
      }

      throw error;
    }
  }

  private async criarPedidoCompleto(
    email: EmailMessage,
    dados: ParsedPedidoData,
  ): Promise<ProcessarPedidoResult> {
    const pedido = await this.pedidos.create(toCreatePedidoInput(email, dados));

    try {
      const itens = await this.pedidoItens.createMany(toCreatePedidoItemInputs(pedido.id, dados));

      const pedidoAtualizado = await this.pedidos.updateStatus(pedido.id, {
        status: PedidoStatus.COMPLETED,
        parserTipo: dados.parserTipo,
        parserConfianca: dados.parserConfianca,
      });

      if (!pedidoAtualizado) {
        throw new Error(`Pedido ${pedido.id} não encontrado após salvar itens`);
      }

      return {
        pedido: pedidoAtualizado,
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
