/*
  Migration 002: Create tables
  Execute este script conectado ao banco email_material_requests.
*/

USE email_material_requests;
GO

-- ---------------------------------------------------------------------------
-- pedidos: e-mail de origem + dados do pedido + status do processamento
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
  SELECT * FROM sys.tables WHERE name = 'pedidos' AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
  CREATE TABLE dbo.pedidos (
    id                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_pedidos PRIMARY KEY DEFAULT NEWID(),
    gmail_message_id   NVARCHAR(255)    NOT NULL,

    -- Dados do e-mail de origem
    email_thread_id    NVARCHAR(255)    NULL,
    email_subject      NVARCHAR(500)    NULL,
    email_sender       NVARCHAR(255)    NOT NULL,
    email_received_at  DATETIME2        NOT NULL,

    -- Dados do pedido extraídos do e-mail
    solicitante_nome   NVARCHAR(255)    NULL,
    solicitante_email  NVARCHAR(255)    NULL,
    departamento       NVARCHAR(255)    NULL,
    urgencia           NVARCHAR(50)     NULL,
    observacoes        NVARCHAR(MAX)    NULL,

    -- Controle de processamento
    status             NVARCHAR(50)     NOT NULL,
    parser_tipo        NVARCHAR(50)     NULL,
    parser_confianca   DECIMAL(5, 4)    NULL,
    erro_mensagem      NVARCHAR(MAX)    NULL,
    processado_em      DATETIME2        NULL,
    created_at         DATETIME2        NOT NULL CONSTRAINT DF_pedidos_created_at DEFAULT SYSUTCDATETIME(),
    updated_at         DATETIME2        NOT NULL CONSTRAINT DF_pedidos_updated_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT UQ_pedidos_gmail_message_id UNIQUE (gmail_message_id),
    CONSTRAINT CK_pedidos_status CHECK (
      status IN ('pending', 'processing', 'completed', 'failed', 'pending_review')
    ),
    CONSTRAINT CK_pedidos_urgencia CHECK (
      urgencia IS NULL OR urgencia IN ('low', 'medium', 'high')
    ),
    CONSTRAINT CK_pedidos_parser_tipo CHECK (
      parser_tipo IS NULL OR parser_tipo IN ('regex', 'llm')
    ),
    CONSTRAINT CK_pedidos_parser_confianca CHECK (
      parser_confianca IS NULL OR (parser_confianca >= 0 AND parser_confianca <= 1)
    )
  );
END
GO

-- ---------------------------------------------------------------------------
-- pedido_itens: materiais de cada pedido (1 pedido → N itens)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
  SELECT * FROM sys.tables WHERE name = 'pedido_itens' AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
  CREATE TABLE dbo.pedido_itens (
    id                   UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_pedido_itens PRIMARY KEY DEFAULT NEWID(),
    pedido_id            UNIQUEIDENTIFIER NOT NULL,
    material_codigo      NVARCHAR(100)    NULL,
    material_descricao   NVARCHAR(500)    NOT NULL,
    quantidade           DECIMAL(18, 4)   NOT NULL,
    unidade              NVARCHAR(50)     NULL,
    created_at           DATETIME2        NOT NULL CONSTRAINT DF_pedido_itens_created_at DEFAULT SYSUTCDATETIME(),

    CONSTRAINT FK_pedido_itens_pedido
      FOREIGN KEY (pedido_id) REFERENCES dbo.pedidos (id) ON DELETE CASCADE,
    CONSTRAINT CK_pedido_itens_quantidade CHECK (quantidade > 0)
  );
END
GO

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
  SELECT * FROM sys.indexes WHERE name = 'IX_pedidos_status' AND object_id = OBJECT_ID('dbo.pedidos')
)
BEGIN
  CREATE INDEX IX_pedidos_status ON dbo.pedidos (status);
END
GO

IF NOT EXISTS (
  SELECT * FROM sys.indexes WHERE name = 'IX_pedidos_gmail_message_id' AND object_id = OBJECT_ID('dbo.pedidos')
)
BEGIN
  CREATE INDEX IX_pedidos_gmail_message_id ON dbo.pedidos (gmail_message_id);
END
GO

IF NOT EXISTS (
  SELECT * FROM sys.indexes WHERE name = 'IX_pedido_itens_pedido_id' AND object_id = OBJECT_ID('dbo.pedido_itens')
)
BEGIN
  CREATE INDEX IX_pedido_itens_pedido_id ON dbo.pedido_itens (pedido_id);
END
GO
