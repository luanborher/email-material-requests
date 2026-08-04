import { env } from "../../config/env.js";
import { isAiConfigured } from "../../config/ai.config.js";
import type { EmailMessage } from "../../types/email.js";
import type { ParsePedidoResult } from "../../types/parser.js";
import { LlmPedidoParser } from "./llm-pedido.parser.js";
import { RegexPedidoParser } from "./regex-pedido.parser.js";

export class PedidoParserService {
  constructor(
    private readonly regexParser: RegexPedidoParser,
    private readonly llmParser: LlmPedidoParser,
    private readonly confidenceThreshold: number,
  ) {}

  async parse(email: EmailMessage): Promise<ParsePedidoResult> {
    const regexResult = this.regexParser.parse(email);

    if (
      regexResult.success &&
      regexResult.data &&
      regexResult.data.parserConfianca >= this.confidenceThreshold
    ) {
      return regexResult;
    }

    if (!isAiConfigured(env.ai)) {
      if (regexResult.success) {
        return regexResult;
      }

      return {
        success: false,
        error:
          regexResult.error ??
          `Parser regex com baixa confiança e Ollama não está habilitado`,
      };
    }

    try {
      const llmResult = await this.llmParser.parse(email);

      if (llmResult.success && llmResult.data) {
        return llmResult;
      }

      if (regexResult.success) {
        return regexResult;
      }

      return llmResult;
    } catch (error) {
      if (regexResult.success) {
        return regexResult;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro no parser LLM",
      };
    }
  }
}

export const pedidoParserService = new PedidoParserService(
  new RegexPedidoParser(),
  new LlmPedidoParser(),
  env.ai.confidenceThreshold,
);
