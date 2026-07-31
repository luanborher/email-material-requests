# Email Material Requests

Sistema que lê a caixa de entrada de e-mail, identifica requisições de pedido de materiais e cria pedidos automaticamente no sistema integrado.

## Requisitos

- Node.js >= 22.x
- npm >= 10.x
- Docker Desktop
- SSMS (opcional — para visualizar o banco)

## Setup rápido

```bash
docker compose up -d
cp .env.example .env
npm install
npm run dev
```

Pronto. Acesse `http://localhost:3000/health` — deve retornar `"database": { "status": "connected" }`.

## Conectar no SSMS

| Campo | Valor |
|-------|-------|
| Server name | `localhost,14333` |
| Login | `sa` |
| Password | `EmailMaterial@123` |
| Database | `email_material_requests` |

## Scripts

| Script | Descrição |
|--------|-----------|
| `docker compose up -d` | Sobe SQL Server + roda migrations |
| `docker compose down` | Para os containers |
| `docker compose down -v` | Para e **apaga os dados** do banco |
| `npm run dev` | Inicia o servidor com hot-reload |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a versão compilada |
| `npm run typecheck` | Verifica tipos sem compilar |
| `npm test` | Roda os testes (Vitest) |
| `npm run test:watch` | Testes em modo watch |

## Estrutura

```
database/
└── migrations/          # Scripts SQL (aplicados automaticamente pelo Docker)

src/
├── config/              # Variáveis de ambiente (importar de config/env.js)
├── database/            # Pool de conexão e mappers
├── repositories/        # Acesso a dados
├── routes/              # Rotas HTTP (Express)
├── services/            # Lógica de negócio / orquestração
├── types/               # Tipos, enums e interfaces
├── utils/               # Funções utilitárias
├── app.ts               # Configuração do Express
└── server.ts            # Entry point

docker-compose.yml       # SQL Server + migrations automáticas
```

> Imports são **diretos** ao arquivo de origem (sem `index.ts` barrel files).

## Camadas e responsabilidades

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| **Schema** | `database/migrations/` | Definição do banco (SQL puro) |
| **Infraestrutura** | `src/database/` | Pool de conexão, mappers row → entity |
| **Acesso a dados** | `src/repositories/` | Queries parametrizadas, sem lógica de negócio |
| **Negócio** | `src/services/` | Orquestração, regras, integrações |
| **HTTP** | `src/routes/` | Entrada/saída da API |

## Variáveis de ambiente

Copie `.env.example` para `.env`. A senha `DB_PASSWORD` deve ser a mesma do `docker-compose.yml`.

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DB_PASSWORD` | Sim | Senha do SQL Server (`EmailMaterial@123` no Docker) |
| `DB_PORT` | Sim (default `14333`) | Porta mapeada no host |
| `DB_SERVER`, `DB_DATABASE`, `DB_USER` | Sim (com defaults) | Conexão com o banco |
| `GMAIL_*` | Parcial | OAuth na Task 3 — ver [docs/gmail-oauth.md](docs/gmail-oauth.md) |
| `GEMINI_API_KEY` | Não (Task 5) | API key do Google Gemini (fallback LLM) |
| `AI_PROVIDER` | Não | `gemini` (padrão) ou `openai` |
| `OPENAI_API_KEY` | Não (Task 5) | API key OpenAI (alternativa) |
| `ORDER_SYSTEM_*` | Não (Task 6) | Integração com sistema de pedidos |

## Endpoints

- `GET /health` — Health check do serviço e conexão com o banco
- `GET /auth/gmail` — Inicia OAuth do Gmail (setup)
- `GET /gmail/messages/unread` — Lista e-mails não lidos
- `GET /gmail/messages/:id/parse` — Parseia e-mail do Gmail e salva no banco
- `POST /parser/parse` — Parseia e salva pedido no banco (teste manual)

Guia OAuth: [docs/gmail-oauth.md](docs/gmail-oauth.md) · Parser: [docs/parser.md](docs/parser.md)

## Tasks

- [x] Task 0 — Estrutura base
- [x] Task 1 — Banco de dados (SQL Server)
- [x] Task 2 — Validação de ambiente (Zod)
- [x] Task 3 — Gmail API (OAuth)
- [x] Task 5 — Parser híbrido (regex + LLM)
- [ ] Task 4 — Classificador de e-mail
- [ ] Task 6 — Integração com sistema de pedidos
- [ ] Task 7 — Orquestrador / Worker
- [ ] Task 8 — Tratamento de erros e revisão manual
