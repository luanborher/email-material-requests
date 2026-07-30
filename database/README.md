# Migrations — SQL Server

Scripts versionados para criar o banco e as tabelas do projeto.

## Com Docker (recomendado)

As migrations rodam **automaticamente** ao subir o Docker (`db-init`).

```bash
docker compose up -d
```

## Conectar no SSMS

| Campo | Valor |
|-------|-------|
| Server name | `localhost,14333` |
| Authentication | SQL Server Authentication |
| Login | `sa` |
| Password | `EmailMaterial@123` |

Banco: `email_material_requests`

Tabelas esperadas: `pedidos`, `pedido_itens`

```sql
USE email_material_requests;
SELECT name FROM sys.tables ORDER BY name;
```

## Sem Docker (manual)

Execute no SSMS, na ordem:

| Ordem | Arquivo | Conexão |
|-------|---------|---------|
| 1 | `001_create_database.sql` | Banco `master` |
| 2 | `002_create_tables.sql` | Banco `email_material_requests` |

## Modelo de dados

```
pedidos (1) ──< pedido_itens
```

| Tabela | Responsabilidade |
|--------|------------------|
| `pedidos` | E-mail de origem + dados do pedido + status do processamento |
| `pedido_itens` | Materiais de cada pedido (1 pedido → N itens) |
