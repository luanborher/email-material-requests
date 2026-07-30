import type { Pedido } from '../../types/entities.js';
import type { PedidoRow } from '../rows.js';

export function mapPedidoRow(row: PedidoRow): Pedido {
  return {
    id: row.id,
    gmailMessageId: row.gmail_message_id,
    emailThreadId: row.email_thread_id,
    emailSubject: row.email_subject,
    emailSender: row.email_sender,
    emailReceivedAt: row.email_received_at,
    solicitanteNome: row.solicitante_nome,
    solicitanteEmail: row.solicitante_email,
    departamento: row.departamento,
    urgencia: row.urgencia,
    observacoes: row.observacoes,
    status: row.status,
    parserTipo: row.parser_tipo,
    parserConfianca: row.parser_confianca !== null ? Number(row.parser_confianca) : null,
    erroMensagem: row.erro_mensagem,
    processadoEm: row.processado_em,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
