import type { ParserType, PedidoStatus, UrgencyLevel } from './enums.js';

export interface Pedido {
  id: string;
  gmailMessageId: string;
  emailThreadId: string | null;
  emailSubject: string | null;
  emailSender: string;
  emailReceivedAt: Date;
  solicitanteNome: string | null;
  solicitanteEmail: string | null;
  departamento: string | null;
  urgencia: UrgencyLevel | null;
  observacoes: string | null;
  status: PedidoStatus;
  parserTipo: ParserType | null;
  parserConfianca: number | null;
  erroMensagem: string | null;
  processadoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PedidoItem {
  id: string;
  pedidoId: string;
  materialCodigo: string | null;
  materialDescricao: string;
  quantidade: number;
  unidade: string | null;
  createdAt: Date;
}

export interface CreatePedidoInput {
  gmailMessageId: string;
  emailThreadId?: string | null;
  emailSubject?: string | null;
  emailSender: string;
  emailReceivedAt: Date;
  solicitanteNome?: string | null;
  solicitanteEmail?: string | null;
  departamento?: string | null;
  urgencia?: UrgencyLevel | null;
  observacoes?: string | null;
  status?: PedidoStatus;
  parserTipo?: ParserType | null;
  parserConfianca?: number | null;
}

export interface CreatePedidoItemInput {
  pedidoId: string;
  materialCodigo?: string | null;
  materialDescricao: string;
  quantidade: number;
  unidade?: string | null;
}

export interface UpdatePedidoStatusInput {
  status: PedidoStatus;
  parserTipo?: ParserType | null;
  parserConfianca?: number | null;
  erroMensagem?: string | null;
}
