import './test-utils/test-env';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { PrismaService } from './prisma/prisma.service';
import { createPrismaMock, PrismaMock } from './test-utils/prisma-mock';

/**
 * Sobe o app inteiro (módulos, guard global, validação) com o Prisma falso
 * e testa as rotas como o front chamaria.
 */
describe('rotas da API', () => {
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

  afterAll(() => app.close());

  async function login() {
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      password: await bcrypt.hash('senha123', 4),
    } as any);
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@a.com', password: 'senha123' });
    return res.body.accessToken as string;
  }

  describe('rotas públicas', () => {
    it('GET /health responde sem token', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200, { status: 'ok' });
    });

    it('POST /user (cadastro) não exige token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u1', name: 'ana' } as any);

      await request(app.getHttpServer())
        .post('/user')
        .send({ name: 'ana', email: 'ana@a.com', password: '123456' })
        .expect(201);
    });
  });

  describe('login', () => {
    it('corpo inválido → 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'não é email' })
        .expect(400);
    });

    it('usuário inexistente → 401', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'x@x.com', password: 'qualquer' })
        .expect(401);
    });

    it('devolve accessToken (grafia certa) que funciona nas rotas protegidas', async () => {
      const token = await login();
      expect(token).toEqual(expect.any(String));

      prisma.post.count.mockResolvedValue(0);
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u1' } as any);

      const res = await request(app.getHttpServer())
        .get('/user/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(prisma.user.findUnique).toHaveBeenLastCalledWith(
        expect.objectContaining({ where: { id: 'u1' } }),
      );
      expect(res.body.id).toBe('u1');
    });
  });

  describe('guard global', () => {
    it.each([
      ['get', '/posts'],
      ['get', '/user/me'],
      ['get', '/notification'],
      ['post', '/comment'],
    ] as const)('%s %s sem token → 401', async (method, url) => {
      await request(app.getHttpServer())[method](url).expect(401);
    });
  });

  describe('rotas removidas', () => {
    it.each([
      ['get', '/'],
      ['get', '/user'],
      ['get', '/user/u1/posts'],
      ['post', '/user/avatar'],
      ['get', '/uploads/avatars/x.jpg'],
    ] as const)('%s %s → 404', async (method, url) => {
      const token = await login();
      await request(app.getHttpServer())
        [method](url)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('edição', () => {
    it.each([
      ['/posts/p1', {}],
      ['/posts/p1', { title: 'x'.repeat(101) }],
      ['/comment/c1', { content: '' }],
    ])('PATCH %s com corpo inválido → 400', async (url, body) => {
      const token = await login();
      await request(app.getHttpServer())
        .patch(url)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
    });

    it.each(['/posts/p1', '/comment/c1'])(
      'PATCH %s sem token → 401',
      async (url) => {
        await request(app.getHttpServer())
          .patch(url)
          .send({ content: 'x' })
          .expect(401);
      },
    );
  });

  describe('paginação por cursor', () => {
    const lists = [
      ['/posts', () => prisma.post.findMany],
      ['/posts/me', () => prisma.post.findMany],
      ['/posts/user/u2', () => prisma.post.findMany],
      ['/comment/post/p1', () => prisma.comment.findMany],
      ['/notification', () => prisma.notification.findMany],
    ] as const;

    it.each(lists)(
      'GET %s?cursor=&limit= devolve { items, nextCursor }',
      async (url, findMany) => {
        const token = await login();
        findMany().mockClear();
        findMany().mockResolvedValueOnce([]);

        const res = await request(app.getHttpServer())
          .get(`${url}?cursor=abc&limit=5`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(res.body).toEqual({ items: [], nextCursor: null });
        expect(findMany()).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 6,
            skip: 1,
            cursor: { id: 'abc' },
          }),
        );
      },
    );

    it.each(lists)('GET %s?limit=999 → 400', async (url) => {
      const token = await login();
      await request(app.getHttpServer())
        .get(`${url}?limit=999`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
