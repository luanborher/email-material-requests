import type { ParserType, PedidoStatus, UrgencyLevel } from '../types/enums.js';

export interface PedidoRow {
  id: string;
  gmail_message_id: string;
  email_thread_id: string | null;
  email_subject: string | null;
  email_sender: string;
  email_received_at: Date;
  solicitante_nome: string | null;
  solicitante_email: string | null;
  departamento: string | null;
  urgencia: UrgencyLevel | null;
  observacoes: string | null;
  status: PedidoStatus;
  parser_tipo: ParserType | null;
  parser_confianca: number | null;
  erro_mensagem: string | null;
  processado_em: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PedidoItemRow {
  id: string;
  pedido_id: string;
  material_codigo: string | null;
  material_descricao: string;
  quantidade: number;
  unidade: string | null;
  created_at: Date;
}
