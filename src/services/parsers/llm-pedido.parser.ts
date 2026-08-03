import { z } from 'zod';
import { env } from '../../config/env.js';
import { assertAiConfigured } from '../../config/ai.config.js';
import type { EmailMessage, ParsedPedidoData } from '../../types/email.js';
import type { ParsePedidoResult } from '../../types/parser.js';
import { ParserType } from '../../types/enums.js';
import { normalizeEmailBody } from '../../utils/email-text.js';
import { callOllama } from './llm.client.js';

const llmResponseSchema = z.object({
  solicitanteNome: z.string().nullable().optional(),
  solicitanteEmail: z.string().nullable().optional(),
  departamento: z.string().nullable().optional(),
  urgencia: z.enum(['low', 'medium', 'high']).nullable().optional(),
  observacoes: z.string().nullable().optional(),
  confianca: z.number().min(0).max(1),
  itens: z
    .array(
      z.object({
        materialCodigo: z.string().nullable().optional(),
        materialDescricao: z.string().min(1),
        quantidade: z.number().positive(),
        unidade: z.string().nullable().optional(),
      }),
    )
    .min(1),
});

export class LlmPedidoParser {
  async parse(email: EmailMessage): Promise<ParsePedidoResult> {
    assertAiConfigured(env.ai);

    const body = normalizeEmailBody(email.body);
    const prompt = this.buildPrompt(email, body);
    const content = await callOllama(prompt);
    const parsedJson = this.extractJson(content);
    const validated = llmResponseSchema.safeParse(parsedJson);

    if (!validated.success) {
      return {
        success: false,
        error: 'Resposta do LLM em formato inválido',
      };
    }

    const data: ParsedPedidoData = {
      solicitanteNome: validated.data.solicitanteNome ?? null,
      solicitanteEmail: validated.data.solicitanteEmail ?? email.sender,
      departamento: validated.data.departamento ?? null,
      urgencia: validated.data.urgencia ?? null,
      observacoes: validated.data.observacoes ?? null,
      itens: validated.data.itens,
      parserTipo: ParserType.LLM,
      parserConfianca: validated.data.confianca,
    };

    return { success: true, data };
  }

  private buildPrompt(email: EmailMessage, body: string): string {
    return `Assunto: ${email.subject ?? '-'}
De: ${email.sender}
Corpo:
${body}`;
  }

  private extractJson(content: string): unknown {
    const trimmed = content.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('JSON não encontrado na resposta do LLM');
      }

      return JSON.parse(match[0]);
    }
  }
}
