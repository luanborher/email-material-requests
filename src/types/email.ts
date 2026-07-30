import type { Pedido, PedidoItem } from './entities.js';
import type { ParserType, UrgencyLevel } from './enums.js';

export interface EmailMessage {
  gmailMessageId: string;
  threadId?: string | null;
  subject?: string | null;
  sender: string;
  receivedAt: Date;
  body: string;
}

export interface ParsedPedidoItem {
  materialCodigo?: string | null;
  materialDescricao: string;
  quantidade: number;
  unidade?: string | null;
}

export interface ParsedPedidoData {
  solicitanteNome?: string | null;
  solicitanteEmail?: string | null;
  departamento?: string | null;
  urgencia?: UrgencyLevel | null;
  observacoes?: string | null;
  itens: ParsedPedidoItem[];
  parserTipo: ParserType;
  parserConfianca: number;
}

export interface ProcessarPedidoResult {
  pedido: Pedido;
  itens: PedidoItem[];
  skipped: boolean;
}
