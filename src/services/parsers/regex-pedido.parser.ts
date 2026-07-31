import type { EmailMessage, ParsedPedidoData, ParsedPedidoItem } from '../../types/email.js';
import type { ParsePedidoResult } from '../../types/parser.js';
import { ParserType, UrgencyLevel } from '../../types/enums.js';
import { normalizeEmailBody, parseQuantity, parseSenderName } from '../../utils/email-text.js';

const PEDIDO_KEYWORDS = /pedido|solicita[cç][aã]o|requisi[cç][aã]o|material|materiais/i;

const DEPARTAMENTO_PATTERN = /departamento\s*:\s*(.+)/i;
const URGENCIA_PATTERN = /urg[êe]ncia\s*:\s*(alta|m[eé]dia|baixa)/i;
const OBRA_PATTERN = /obra\s*:\s*(.+)/i;

const ITEM_PATTERNS = [
  /^[-*•]\s*(\d+(?:[.,]\d+)?)\s+(.+)$/i,
  /^(\d+(?:[.,]\d+)?)\s*(x|un|unid\.?|unidades?|pcs|pe[cç]as?|m|metros?|kg|litros?|l)\s+(?:de\s+)?(.+)$/i,
  /^(\d+(?:[.,]\d+)?)\s*[-–]\s*(.+)$/i,
  /^(\d+(?:[.,]\d+)?)\s+(.+)$/i,
];

export class RegexPedidoParser {
  parse(email: EmailMessage): ParsePedidoResult {
    const body = normalizeEmailBody(email.body);
    const subject = email.subject ?? '';
    const itens = this.extractItems(body);

    if (itens.length === 0) {
      return {
        success: false,
        error: 'Nenhum item encontrado no corpo do e-mail',
      };
    }

    const departamento = this.extractMatch(body, DEPARTAMENTO_PATTERN);
    const urgencia = this.extractUrgency(body);
    const observacoes = this.extractMatch(body, OBRA_PATTERN);
    const confianca = this.calculateConfidence({
      subject,
      body,
      itensCount: itens.length,
      hasDepartamento: Boolean(departamento),
      hasUrgencia: Boolean(urgencia),
    });

    const data: ParsedPedidoData = {
      solicitanteNome: parseSenderName(email.sender),
      solicitanteEmail: email.sender,
      departamento,
      urgencia,
      observacoes,
      itens,
      parserTipo: ParserType.REGEX,
      parserConfianca: confianca,
    };

    return { success: true, data };
  }

  private extractItems(body: string): ParsedPedidoItem[] {
    const lines = body.split('\n').map((line) => line.trim()).filter(Boolean);
    const itens: ParsedPedidoItem[] = [];

    for (const line of lines) {
      const item = this.parseItemLine(line);
      if (item) {
        itens.push(item);
      }
    }

    return itens;
  }

  private parseItemLine(line: string): ParsedPedidoItem | null {
    for (const pattern of ITEM_PATTERNS) {
      const match = line.match(pattern);
      if (!match) {
        continue;
      }

      if (match.length === 3) {
        const [, quantityRaw, description] = match;
        return {
          materialDescricao: description.trim(),
          quantidade: parseQuantity(quantityRaw),
          unidade: this.extractUnitFromDescription(description),
        };
      }

      if (match.length === 4) {
        const [, quantityRaw, unit, description] = match;
        return {
          materialDescricao: description.trim(),
          quantidade: parseQuantity(quantityRaw),
          unidade: unit.toLowerCase(),
        };
      }
    }

    return null;
  }

  private extractUnitFromDescription(description: string): string | null {
    const unitMatch = description.match(/\b(un|unid|m|kg|l|litros?)\b/i);
    return unitMatch ? unitMatch[1].toLowerCase() : null;
  }

  private extractMatch(body: string, pattern: RegExp): string | null {
    const match = body.match(pattern);
    return match?.[1]?.trim() ?? null;
  }

  private extractUrgency(body: string): ParsedPedidoData['urgencia'] {
    const match = body.match(URGENCIA_PATTERN);
    if (!match) {
      return null;
    }

    const value = match[1].toLowerCase();

    if (value === 'alta') return UrgencyLevel.HIGH;
    if (value === 'baixa') return UrgencyLevel.LOW;
    return UrgencyLevel.MEDIUM;
  }

  private calculateConfidence(input: {
    subject: string;
    body: string;
    itensCount: number;
    hasDepartamento: boolean;
    hasUrgencia: boolean;
  }): number {
    let score = 0.45;

    if (input.itensCount >= 1) score += 0.25;
    if (input.itensCount >= 2) score += 0.05;
    if (PEDIDO_KEYWORDS.test(input.subject) || PEDIDO_KEYWORDS.test(input.body)) score += 0.15;
    if (input.hasDepartamento) score += 0.05;
    if (input.hasUrgencia) score += 0.05;

    return Math.min(Number(score.toFixed(2)), 1);
  }
}
