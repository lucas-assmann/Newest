import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** O que o JwtStrategy coloca em `req.user`. */
export interface AuthUser {
  id: string;
}

export function getCurrentUser(
  _data: unknown,
  ctx: ExecutionContext,
): AuthUser {
  return ctx.switchToHttp().getRequest<{ user: AuthUser }>().user;
}

/** Usuário logado: `@CurrentUser() user: AuthUser` no lugar de `@Req() req` + `req.user.id`. */
export const CurrentUser = createParamDecorator(getCurrentUser);
