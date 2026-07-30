import sql from 'mssql';
import { env } from '../config/env.js';

let pool: sql.ConnectionPool | null = null;

function buildConfig(): sql.config {
  return {
    server: env.database.server,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password,
    options: {
      encrypt: env.database.encrypt,
      trustServerCertificate: env.database.trustServerCertificate,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30_000,
    },
  };
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(buildConfig()).connect();
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const connection = await getPool();
  const result = await connection.request().query('SELECT 1 AS ok');

  return result.recordset[0]?.ok === 1;
}

export { sql };
