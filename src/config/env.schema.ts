import { z } from 'zod';

const booleanFromEnv = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const optionalNonEmptyString = z.string().min(1).optional();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_SERVER: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(14333),
  DB_DATABASE: z.string().min(1).default('email_material_requests'),
  DB_USER: z.string().min(1).default('sa'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_ENCRYPT: booleanFromEnv.default('true'),
  DB_TRUST_SERVER_CERTIFICATE: booleanFromEnv.default('true'),

  EMAIL_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),

  GMAIL_CLIENT_ID: optionalNonEmptyString,
  GMAIL_CLIENT_SECRET: optionalNonEmptyString,
  GMAIL_REFRESH_TOKEN: optionalNonEmptyString,
  GMAIL_USER_EMAIL: z.string().email().optional(),
  GMAIL_REDIRECT_URI: z.string().url().default('http://localhost:3000/auth/gmail/callback'),

  ORDER_SYSTEM_API_URL: z.string().optional(),
  ORDER_SYSTEM_API_KEY: optionalNonEmptyString,

  AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  GEMINI_API_KEY: optionalNonEmptyString,
  GEMINI_MODEL: z.string().min(1).default('gemini-2.0-flash-lite'),
  OPENAI_API_KEY: optionalNonEmptyString,
  AI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
});

export type RawEnv = z.infer<typeof envSchema>;
export type AiProvider = RawEnv['AI_PROVIDER'];

export interface Env {
  nodeEnv: RawEnv['NODE_ENV'];
  port: number;
  database: {
    server: string;
    port: number;
    name: string;
    user: string;
    password: string;
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
  email: {
    pollIntervalMs: number;
    gmail: {
      clientId?: string;
      clientSecret?: string;
      refreshToken?: string;
      userEmail?: string;
      redirectUri: string;
    };
  };
  orderSystem: {
    apiUrl?: string;
    apiKey?: string;
  };
  ai: {
    provider: AiProvider;
    geminiApiKey?: string;
    geminiModel: string;
    openaiApiKey?: string;
    openaiModel: string;
    confidenceThreshold: number;
  };
}

export function mapRawEnvToConfig(raw: RawEnv): Env {
  return {
    nodeEnv: raw.NODE_ENV,
    port: raw.PORT,
    database: {
      server: raw.DB_SERVER,
      port: raw.DB_PORT,
      name: raw.DB_DATABASE,
      user: raw.DB_USER,
      password: raw.DB_PASSWORD,
      encrypt: raw.DB_ENCRYPT,
      trustServerCertificate: raw.DB_TRUST_SERVER_CERTIFICATE,
    },
    email: {
      pollIntervalMs: raw.EMAIL_POLL_INTERVAL_MS,
      gmail: {
        clientId: raw.GMAIL_CLIENT_ID,
        clientSecret: raw.GMAIL_CLIENT_SECRET,
        refreshToken: raw.GMAIL_REFRESH_TOKEN,
        userEmail: raw.GMAIL_USER_EMAIL,
        redirectUri: raw.GMAIL_REDIRECT_URI,
      },
    },
    orderSystem: {
      apiUrl: raw.ORDER_SYSTEM_API_URL || undefined,
      apiKey: raw.ORDER_SYSTEM_API_KEY,
    },
    ai: {
      provider: raw.AI_PROVIDER,
      geminiApiKey: raw.GEMINI_API_KEY,
      geminiModel: raw.GEMINI_MODEL,
      openaiApiKey: raw.OPENAI_API_KEY,
      openaiModel: raw.AI_MODEL,
      confidenceThreshold: raw.AI_CONFIDENCE_THRESHOLD,
    },
  };
}
