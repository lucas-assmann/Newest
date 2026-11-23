import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { parseCorsOrigins } from './config/env';

/** Configuração comum ao app de verdade (main.ts) e aos testes de rota. */
export function configureApp(app: INestApplication) {
  // No Render o app fica atrás de um proxy: sem isto, todo mundo teria o
  // mesmo IP e o limite de tentativas do login travaria todos juntos.
  (
    app.getHttpAdapter().getInstance() as { set(k: string, v: unknown): void }
  ).set('trust proxy', true);
  app.enableCors({
    origin: parseCorsOrigins(process.env.CORS_ORIGINS),
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableShutdownHooks();
}
