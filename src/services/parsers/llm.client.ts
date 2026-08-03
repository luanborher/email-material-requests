import { env } from '../../config/env.js';

const SYSTEM_PROMPT =
  'Extraia pedidos de materiais de e-mails. Responda só JSON com: solicitanteNome, solicitanteEmail, departamento, urgencia (low|medium|high), observacoes, confianca (0-1), itens[{materialCodigo, materialDescricao, quantidade, unidade}].';

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
  error?: string;
}

export async function callOllama(prompt: string): Promise<string> {
  const baseUrl = env.ai.ollamaBaseUrl.replace(/\/$/, '');
  const model = env.ai.ollamaModel;
  const url = `${baseUrl}/api/chat`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        format: 'json',
        stream: false,
        options: {
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorBody}`);
    }

    const payload = (await response.json()) as OllamaChatResponse;
    const content = payload.message?.content;

    if (!content) {
      throw new Error(payload.error ?? 'Ollama não retornou conteúdo');
    }

    return content;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Ollama API error')) {
      throw error;
    }

    throw new Error(
      `Falha ao conectar com Ollama em ${baseUrl}. Verifique se o serviço está rodando (ollama serve).`,
    );
  }
}
