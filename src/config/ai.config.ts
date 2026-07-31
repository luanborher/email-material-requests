import type { AiProvider, Env } from './env.schema.js';

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

export function isAiConfigured(ai: Env['ai']): boolean {
  if (ai.provider === 'gemini') {
    return Boolean(ai.geminiApiKey);
  }

  return Boolean(ai.openaiApiKey);
}

export function assertAiConfigured(ai: Env['ai']): void {
  if (isAiConfigured(ai)) {
    return;
  }

  if (ai.provider === 'gemini') {
    throw new AiConfigError(
      'Gemini não configurado. Defina GEMINI_API_KEY no .env para usar o parser LLM',
    );
  }

  throw new AiConfigError(
    'OpenAI não configurada. Defina OPENAI_API_KEY no .env para usar o parser LLM',
  );
}

export function getActiveAiProvider(ai: Env['ai']): AiProvider {
  return ai.provider;
}
