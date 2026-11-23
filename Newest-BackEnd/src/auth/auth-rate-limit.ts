import { applyDecorators, Injectable, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Nome do limite usado no login e no cadastro (configurado no AppModule). */
export const AUTH_THROTTLER = 'auth';

/**
 * Conta as tentativas pelo IP de quem acessa. Atrás de proxy (Render), o IP
 * real é o primeiro do X-Forwarded-For (`req.ips[0]`, com `trust proxy`).
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: { ip?: string; ips?: string[] }): Promise<string> {
    return Promise.resolve(req.ips?.[0] ?? req.ip ?? 'desconhecido');
  }
}

/** Limita tentativas por IP (padrão: 5 por minuto). Usado no login e no cadastro. */
export const AuthRateLimit = () =>
  applyDecorators(UseGuards(AuthThrottlerGuard));
