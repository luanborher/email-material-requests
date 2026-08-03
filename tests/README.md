# Testes

Todos os testes ficam em `tests/`, na raiz do projeto, separados do código em `src/`.

## Estrutura

```
tests/
├── fixtures/          # Dados reutilizáveis (e-mails, pedidos mock)
├── services/          # Testes de services (espelha src/services/)
│   └── parsers/       # Testes dos parsers regex/LLM
└── utils/             # Testes de utilitários
```

## Comandos

```bash
npm test           # roda todos os testes
npm run test:watch # modo watch
```

## Convenções

- Arquivos: `*.test.ts`
- Imports do código fonte: `../../src/services/...` (relativo ao arquivo de teste)
- Mocks de módulos: caminho igual ao usado pelo arquivo testado em `src/`
