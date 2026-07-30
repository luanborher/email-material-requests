import { getPool } from '../database/connection.js';
import { mapPedidoRow } from '../database/mappers/pedido.mapper.js';
import type {
  CreatePedidoInput,
  Pedido,
  UpdatePedidoStatusInput,
} from '../types/entities.js';
import { PedidoStatus } from '../types/enums.js';

export class PedidoRepository {
  async findByGmailMessageId(gmailMessageId: string): Promise<Pedido | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('gmailMessageId', gmailMessageId)
      .query(`
        SELECT *
        FROM dbo.pedidos
        WHERE gmail_message_id = @gmailMessageId
      `);

    const row = result.recordset[0];

    return row ? mapPedidoRow(row) : null;
  }

  async findById(id: string): Promise<Pedido | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', id)
      .query(`
        SELECT *
        FROM dbo.pedidos
        WHERE id = @id
      `);

    const row = result.recordset[0];

    return row ? mapPedidoRow(row) : null;
  }

  async create(input: CreatePedidoInput): Promise<Pedido> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('gmailMessageId', input.gmailMessageId)
      .input('emailThreadId', input.emailThreadId ?? null)
      .input('emailSubject', input.emailSubject ?? null)
      .input('emailSender', input.emailSender)
      .input('emailReceivedAt', input.emailReceivedAt)
      .input('solicitanteNome', input.solicitanteNome ?? null)
      .input('solicitanteEmail', input.solicitanteEmail ?? null)
      .input('departamento', input.departamento ?? null)
      .input('urgencia', input.urgencia ?? null)
      .input('observacoes', input.observacoes ?? null)
      .input('status', input.status ?? PedidoStatus.PENDING)
      .input('parserTipo', input.parserTipo ?? null)
      .input('parserConfianca', input.parserConfianca ?? null)
      .query(`
        INSERT INTO dbo.pedidos (
          gmail_message_id,
          email_thread_id,
          email_subject,
          email_sender,
          email_received_at,
          solicitante_nome,
          solicitante_email,
          departamento,
          urgencia,
          observacoes,
          status,
          parser_tipo,
          parser_confianca
        )
        OUTPUT INSERTED.*
        VALUES (
          @gmailMessageId,
          @emailThreadId,
          @emailSubject,
          @emailSender,
          @emailReceivedAt,
          @solicitanteNome,
          @solicitanteEmail,
          @departamento,
          @urgencia,
          @observacoes,
          @status,
          @parserTipo,
          @parserConfianca
        )
      `);

    return mapPedidoRow(result.recordset[0]);
  }

  async updateStatus(id: string, input: UpdatePedidoStatusInput): Promise<Pedido | null> {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', id)
      .input('status', input.status)
      .input('parserTipo', input.parserTipo ?? null)
      .input('parserConfianca', input.parserConfianca ?? null)
      .input('erroMensagem', input.erroMensagem ?? null)
      .input('processadoEm', new Date())
      .query(`
        UPDATE dbo.pedidos
        SET
          status = @status,
          parser_tipo = @parserTipo,
          parser_confianca = @parserConfianca,
          erro_mensagem = @erroMensagem,
          processado_em = @processadoEm,
          updated_at = SYSUTCDATETIME()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    const row = result.recordset[0];

    return row ? mapPedidoRow(row) : null;
  }
}

export const pedidoRepository = new PedidoRepository();
