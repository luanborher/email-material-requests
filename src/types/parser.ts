import type { ParsedPedidoData } from './email.js';

export interface ParsePedidoResult {
  success: boolean;
  data?: ParsedPedidoData;
  error?: string;
}
