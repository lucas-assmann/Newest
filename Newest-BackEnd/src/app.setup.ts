import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { parseCorsOrigins } from './config/env';

/** Configuração comum ao app de verdade (main.ts) e aos testes de rota. */
export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGINS),
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableShutdownHooks();
}
