import { env } from '../../config/env.js';

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    details?: Array<{
      '@type'?: string;
      retryDelay?: string;
    }>;
  };
}

function parseRetryDelaySeconds(errorBody: string): number | null {
  try {
    const json = JSON.parse(errorBody) as GeminiGenerateResponse;
    const retryInfo = json.error?.details?.find((detail) =>
      detail['@type']?.includes('RetryInfo'),
    );

    if (!retryInfo?.retryDelay) {
      return null;
    }

    const seconds = Number.parseInt(retryInfo.retryDelay.replace(/\D/g, ''), 10);
    return Number.isNaN(seconds) || seconds <= 0 ? null : seconds;
  } catch {
    return null;
  }
}

function formatGeminiError(status: number, errorBody: string): Error {
  try {
    const json = JSON.parse(errorBody) as GeminiGenerateResponse;
    const apiMessage = json.error?.message ?? errorBody;

    if (status === 429) {
      const retrySeconds = parseRetryDelaySeconds(errorBody);
      const retryHint = retrySeconds
        ? ` Tente novamente em ~${retrySeconds}s.`
        : ' Aguarde cerca de 1 minuto.';

      return new Error(
        `Cota do Gemini (free tier) excedida para o modelo "${env.ai.geminiModel}".${retryHint}`,
      );
    }

    return new Error(`Gemini API error (${status}): ${apiMessage}`);
  } catch {
    return new Error(`Gemini API error: ${status} ${errorBody}`);
  }
}

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = env.ai.geminiApiKey;
  const model = env.ai.geminiModel;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: 'Extraia pedidos de materiais de e-mails. Responda só JSON com: solicitanteNome, solicitanteEmail, departamento, urgencia (low|medium|high), observacoes, confianca (0-1), itens[{materialCodigo, materialDescricao, quantidade, unidade}].',
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw formatGeminiError(response.status, errorBody);
  }

  const payload = (await response.json()) as GeminiGenerateResponse;
  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    const apiMessage = payload.error?.message ?? 'Gemini não retornou conteúdo';
    throw new Error(apiMessage);
  }

  return content;
}

export async function callOpenAi(prompt: string): Promise<string> {
  const apiKey = env.ai.openaiApiKey;
  const model = env.ai.openaiModel;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extraia pedidos de materiais de e-mails. Responda só JSON com: solicitanteNome, solicitanteEmail, departamento, urgencia (low|medium|high), observacoes, confianca (0-1), itens[{materialCodigo, materialDescricao, quantidade, unidade}].',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorBody}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI não retornou conteúdo');
  }

  return content;
}
