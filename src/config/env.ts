import 'dotenv/config';

import { ZodError } from 'zod';
import { envSchema, mapRawEnvToConfig, type Env } from './env.schema.js';

function formatZodError(error: ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.') || 'environment';
    return `  - ${path}: ${issue.message}`;
  });

  return ['Invalid environment variables:', ...issues].join('\n');
}

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(formatZodError(result.error));
    process.exit(1);
  }

  return mapRawEnvToConfig(result.data);
}

export const env = loadEnv();
