import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/config/env.js', () => ({
  env: {
    ai: {
      ollamaEnabled: true,
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      confidenceThreshold: 0.7,
    },
  },
}));

import { callOllama } from '../../../src/services/parser/llm.client.js';

describe('callOllama', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envia prompt e retorna JSON da resposta', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            content: '{"confianca":0.9,"itens":[]}',
          },
        }),
        { status: 200 },
      ),
    );

    const result = await callOllama('Assunto: pedido\nCorpo: 10 parafusos');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toContain('confianca');

    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(String(calledUrl)).toBe('http://localhost:11434/api/chat');

    const body = JSON.parse(String(options?.body));
    expect(body.model).toBe('llama3.2');
    expect(body.format).toBe('json');
    expect(body.stream).toBe(false);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].content).toContain('parafusos');
  });

  it('retorna erro amigável quando Ollama não está acessível', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(callOllama('teste')).rejects.toThrow(/Falha ao conectar com Ollama/);
  });
});
