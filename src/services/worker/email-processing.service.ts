import type { EmailMessage, ProcessarPedidoResult } from "../../types/email.js";
import type { ParsePedidoResult } from "../../types/parser.js";
import { pedidoParserService } from "../parser/pedido-parser.service.js";
import { pedidoService } from "../pedido/pedido.service.instance.js";

export interface ParseAndSaveResult {
  parsed: ParsePedidoResult;
  saved?: ProcessarPedidoResult;
}

export async function parseAndSavePedido(email: EmailMessage): Promise<ParseAndSaveResult> {
  const parsed = await pedidoParserService.parse(email);

  if (!parsed.success || !parsed.data) {
    return { parsed };
  }

  const saved = await pedidoService.processarEmail(email, parsed.data);

  return { parsed, saved };
}
