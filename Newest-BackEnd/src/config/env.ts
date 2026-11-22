import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  /** Origens liberadas no CORS, separadas por vírgula. */
  CORS_ORIGINS: z.string().optional(),
  /** Sem elas, posts com imagem são recusados (a moderação não roda). */
  SIGHTENGINE_USER: z.string().optional(),
  SIGHTENGINE_SECRET: z.string().optional(),
});

/** Usado pelo ConfigModule: o app nem sobe se faltar variável obrigatória. */
export function validateEnv(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Variáveis de ambiente inválidas ou faltando: ${missing}`);
  }
  return { ...config, ...result.data };
}

/** Origens usadas antes de existir CORS_ORIGINS (mantidas para não quebrar o deploy). */
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3001',
  'http://localhost:8080',
  'http://192.168.0.103:8080',
  'https://newest-app.vercel.app',
];

export function parseCorsOrigins(value: string | undefined): string[] {
  if (!value?.trim()) return DEFAULT_CORS_ORIGINS;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
