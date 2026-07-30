/*
  Migration 001: Create database
  Execute este script conectado ao servidor (master).
  No SSMS: conecte-se ao servidor e execute este arquivo.
*/

IF NOT EXISTS (
  SELECT name FROM sys.databases WHERE name = N'email_material_requests'
)
BEGIN
  CREATE DATABASE email_material_requests;
END
GO
