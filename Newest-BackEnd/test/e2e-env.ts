// Ambiente dos testes e2e: sobem o app inteiro contra um banco de verdade.
// Precisa ser importado ANTES do AppModule (o ConfigModule valida ao carregar).
//
// Banco usado, nesta ordem:
//   1. E2E_DATABASE_URL (variável de ambiente; é o que o GitHub Actions vai usar)
//   2. DATABASE_URL do .env.development.local (banco de dev)
// Trava: se o banco for o mesmo do .env (produção, com dados reais), nada roda.
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'dotenv';
import { assertNotProduction } from '../src/test-utils/e2e-guard';

function readEnvFile(name: string): Record<string, string> {
  const file = join(__dirname, '..', name);
  return existsSync(file) ? parse(readFileSync(file)) : {};
}

const url = assertNotProduction(
  process.env.E2E_DATABASE_URL ??
    readEnvFile('.env.development.local').DATABASE_URL,
  readEnvFile('.env').DATABASE_URL,
);

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = 'segredo-de-teste-e2e';
process.env.CORS_ORIGINS = 'http://localhost:8080';
