import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env.js', () => ({
  env: {
    ai: {
      provider: 'gemini',
      geminiApiKey: 'test-gemini-key',
      geminiModel: 'gemini-2.0-flash-lite',
      openaiApiKey: undefined,
      openaiModel: 'gpt-4o-mini',
    },
  },
}));

import { callGemini } from './llm.client.js';

const quotaErrorBody = JSON.stringify({
  error: {
    code: 429,
    message: 'You exceeded your current quota, please check your plan and billing details.',
    status: 'RESOURCE_EXHAUSTED',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.RetryInfo',
        retryDelay: '2s',
      },
    ],
  },
});

describe('callGemini', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envia prompt e retorna JSON da resposta', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '{"confianca":0.9,"itens":[]}' }],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await callGemini('extrair pedido');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toContain('confianca');
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain('generativelanguage.googleapis.com');
    expect(calledUrl).toContain('gemini-2.0-flash-lite');
  });

  it('não retenta após 429', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(quotaErrorBody, { status: 429 }),
    );

    await expect(callGemini('extrair pedido')).rejects.toThrow(
      /Cota do Gemini \(free tier\) excedida/,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
