import '../test-utils/test-env-rate-limit';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { configureApp } from '../app.setup';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../test-utils/prisma-mock';

/**
 * Limite de tentativas no login e no cadastro. Aqui o limite é 2 por minuto
 * (no app de verdade, o padrão é 5), para o teste ser rápido.
 */
describe('limite de tentativas (login e cadastro)', () => {
  let app: INestApplication;
  let prisma: PrismaMock;

  beforeAll(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const login = (ip: string) =>
    request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', ip)
      .send({ email: 'ana@a.com', password: 'errada1' });

  it('login: depois de 2 tentativas do mesmo IP, a 3ª dá 429 com mensagem em português', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await login('10.0.0.1').expect(401);
    await login('10.0.0.1').expect(401);
    const res = await login('10.0.0.1').expect(429);

    expect(res.body.message).toBe(
      'Muitas tentativas. Aguarde um minuto e tente de novo.',
    );
  });

  it('o bloqueio é por IP: outra pessoa (outro IP) continua conseguindo', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await login('10.0.0.2').expect(401);
  });

  it('cadastro também é limitado', async () => {
    const signup = () =>
      request(app.getHttpServer())
        .post('/user')
        .set('X-Forwarded-For', '10.0.0.3')
        .send({ name: 'x' }); // inválido de propósito: 400, sem gravar nada

    await signup().expect(400);
    await signup().expect(400);
    await signup().expect(429);
  });

  it('as outras rotas não têm esse limite', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .get('/health')
        .set('X-Forwarded-For', '10.0.0.1')
        .expect(200);
    }
  });
});
