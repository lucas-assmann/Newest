import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getCurrentUser } from './current-user.decorator';
import { LoginSchema } from './dto/login.dto';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { IS_PUBLIC_KEY } from './public.decorator';

function httpContext(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

describe('autenticação', () => {
  it('@CurrentUser() devolve o usuário que o JWT colocou na requisição', () => {
    expect(
      getCurrentUser(undefined, httpContext({ user: { id: 'u1' } })),
    ).toEqual({
      id: 'u1',
    });
  });

  it('JwtStrategy.validate devolve o id (string/UUID) do token', () => {
    const strategy = new JwtStrategy({ getOrThrow: () => 's' } as any);
    expect(strategy.validate({ sub: 'uuid-1' })).toEqual({ id: 'uuid-1' });
  });

  it('o guard libera rotas marcadas com @Public() sem olhar o token', () => {
    const reflector = new Reflector();
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => key === IS_PUBLIC_KEY);

    const guard = new JwtAuthGuard(reflector);
    expect(guard.canActivate(httpContext({ headers: {} }))).toBe(true);
  });

  describe('LoginSchema', () => {
    it('exige email válido e senha', () => {
      expect(
        LoginSchema.safeParse({ email: 'a@a.com', password: 'x' }).success,
      ).toBe(true);
      expect(LoginSchema.safeParse({ email: 'a', password: 'x' }).success).toBe(
        false,
      );
      expect(LoginSchema.safeParse({ email: 'a@a.com' }).success).toBe(false);
    });
  });
});
