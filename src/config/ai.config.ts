import type { Env } from './env.schema.js';

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

export function isAiConfigured(ai: Env['ai']): boolean {
  return ai.ollamaEnabled && Boolean(ai.ollamaBaseUrl && ai.ollamaModel);
}

export function assertAiConfigured(ai: Env['ai']): void {
  if (isAiConfigured(ai)) {
    return;
  }

  throw new AiConfigError(
    'Ollama desativado ou incompleto. Defina OLLAMA_ENABLED=true, OLLAMA_BASE_URL e OLLAMA_MODEL no .env',
  );
}
