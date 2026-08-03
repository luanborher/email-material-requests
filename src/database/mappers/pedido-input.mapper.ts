import type { CreatePedidoInput, CreatePedidoItemInput } from '../../types/entities.js';
import type { EmailMessage, ParsedPedidoData } from '../../types/email.js';
import { PedidoStatus } from '../../types/enums.js';

export function toCreatePedidoInput(
  email: EmailMessage,
  dados: ParsedPedidoData,
  status: PedidoStatus = PedidoStatus.PROCESSING,
): CreatePedidoInput {
  return {
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
    status,
    parserTipo: dados.parserTipo,
    parserConfianca: dados.parserConfianca,
  };
}

export function toCreatePedidoItemInputs(
  pedidoId: string,
  dados: ParsedPedidoData,
): CreatePedidoItemInput[] {
  return dados.itens.map((item) => ({
    pedidoId,
    materialCodigo: item.materialCodigo,
    materialDescricao: item.materialDescricao,
    quantidade: item.quantidade,
    unidade: item.unidade,
  }));
}
