import './e2e-env';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Testes e2e: o app inteiro contra um banco de verdade (o de dev).
 * Só criam e apagam usuários com email @e2e.test — o resto do banco não é tocado.
 * Apagar o usuário leva junto (cascade) os posts, comentários, likes e notificações dele.
 */
const DOMAIN = '@e2e.test';
const stamp = Date.now().toString(36);
const ana = {
  name: `ana${stamp}`,
  email: `ana${stamp}${DOMAIN}`,
  password: 'senha123',
};
const bia = {
  name: `bia${stamp}`,
  email: `bia${stamp}${DOMAIN}`,
  password: 'senha123',
};

describe('Newest (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tokens: Record<string, string> = {};

  const cleanup = () =>
    prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });

  const api = () => request(app.getHttpServer());
  const as = (who: 'ana' | 'bia') => ({
    get: (url: string) =>
      api().get(url).set('Authorization', `Bearer ${tokens[who]}`),
    post: (url: string) =>
      api().post(url).set('Authorization', `Bearer ${tokens[who]}`),
    patch: (url: string) =>
      api().patch(url).set('Authorization', `Bearer ${tokens[who]}`),
    delete: (url: string) =>
      api().delete(url).set('Authorization', `Bearer ${tokens[who]}`),
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await cleanup(); // sobras de uma rodada que caiu no meio
  });

  afterAll(async () => {
    if (prisma) await cleanup();
    if (app) await app.close();
  });

  describe('conta', () => {
    it('GET /health responde sem token', async () => {
      await api().get('/health').expect(200, { status: 'ok' });
    });

    it('cadastra dois usuários (sem devolver a senha)', async () => {
      for (const user of [ana, bia]) {
        const res = await api().post('/user').send(user).expect(201);
        expect(res.body).toMatchObject({ name: user.name });
        expect(res.body).not.toHaveProperty('password');
      }
    });

    it('não deixa cadastrar o mesmo email de novo', async () => {
      const res = await api()
        .post('/user')
        .send({ ...ana, name: `outro${stamp}` });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('senha errada → 401', async () => {
      await api()
        .post('/auth/login')
        .send({ email: ana.email, password: 'errada1' })
        .expect(401);
    });

    it('login devolve o token, que abre as rotas protegidas', async () => {
      for (const [who, user] of [
        ['ana', ana],
        ['bia', bia],
      ] as const) {
        const res = await api()
          .post('/auth/login')
          .send({ email: user.email, password: user.password })
          .expect(200);
        tokens[who] = res.body.accessToken;
      }
      const me = await as('ana').get('/user/me').expect(200);
      expect(me.body).toMatchObject({
        name: ana.name,
        email: ana.email,
        totalPosts: 0,
      });
    });

    it('sem token → 401', async () => {
      await api().get('/posts').expect(401);
    });
  });

  describe('posts e paginação', () => {
    const postIds: string[] = [];

    it('cria 3 posts; corpo inválido → 400', async () => {
      for (const n of [1, 2, 3]) {
        const res = await as('ana')
          .post('/posts')
          .send({ title: `Post ${n}`, content: `Conteúdo ${n}` })
          .expect(201);
        postIds.push(res.body.id);
      }
      await as('ana')
        .post('/posts')
        .send({ title: 'sem conteúdo' })
        .expect(400);
    });

    it('perfil pagina por cursor: 2 + 1, do mais novo para o mais antigo', async () => {
      const page1 = await as('ana').get('/posts/me?limit=2').expect(200);
      expect(page1.body.items.map((p: { title: string }) => p.title)).toEqual([
        'Post 3',
        'Post 2',
      ]);
      expect(page1.body.nextCursor).toEqual(expect.any(String));

      const page2 = await as('ana')
        .get(`/posts/me?limit=2&cursor=${page1.body.nextCursor}`)
        .expect(200);
      expect(page2.body).toEqual({
        items: [expect.objectContaining({ title: 'Post 1' })],
        nextCursor: null,
      });
    });

    it('a outra pessoa vê os mesmos posts em /posts/user/:id', async () => {
      const me = await as('ana').get('/user/me').expect(200);
      const res = await as('bia').get(`/posts/user/${me.body.id}`).expect(200);
      expect(res.body.items).toHaveLength(3);
      expect(me.body.totalPosts).toBe(3);
    });

    it('o post mais novo da ana aparece no feed', async () => {
      const res = await as('bia').get('/posts?limit=50').expect(200);
      expect(res.body.items.map((p: { id: string }) => p.id)).toContain(
        postIds[2],
      );
    });

    it('limite fora do intervalo → 400', async () => {
      await as('ana').get('/posts?limit=0').expect(400);
    });

    describe('interações', () => {
      it('like da bia: contador sobe e a ana é notificada', async () => {
        const res = await as('bia')
          .patch(`/posts/${postIds[2]}/like`)
          .expect(200);
        expect(res.body).toMatchObject({ isLiked: true, likesCount: 1 });

        const post = await as('bia').get(`/posts/${postIds[2]}`).expect(200);
        expect(post.body).toMatchObject({ likes: 1, isLiked: true });
      });

      it('comentário com @menção vira duas notificações (COMMENT e MENTION)', async () => {
        await as('bia')
          .post('/comment')
          .send({ postId: postIds[2], content: `Boa, @${ana.name}!` })
          .expect(201);

        const comments = await as('ana')
          .get(`/comment/post/${postIds[2]}`)
          .expect(200);
        expect(comments.body.items).toEqual([
          expect.objectContaining({
            content: `Boa, @${ana.name}!`,
            author: expect.objectContaining({ name: bia.name }),
          }),
        ]);

        const notes = await as('ana').get('/notification').expect(200);
        const types = notes.body.items
          .map((n: { type: string }) => n.type)
          .sort();
        expect(types).toEqual(['COMMENT', 'LIKE', 'MENTION']);
        expect(
          notes.body.items.every(
            (n: { actor: { name: string } }) => n.actor.name === bia.name,
          ),
        ).toBe(true);
      });

      it('tirar o like apaga a notificação de like', async () => {
        const res = await as('bia')
          .patch(`/posts/${postIds[2]}/like`)
          .expect(200);
        expect(res.body).toMatchObject({ isLiked: false, likesCount: 0 });

        const notes = await as('ana').get('/notification').expect(200);
        expect(
          notes.body.items.map((n: { type: string }) => n.type).sort(),
        ).toEqual(['COMMENT', 'MENTION']);
      });

      it('contador de não lidas e "marcar todas como lidas"', async () => {
        const before = await as('ana')
          .get('/notification/unread-count')
          .expect(200);
        expect(Number(before.text)).toBe(2);

        await as('ana').patch('/notification/mark-all-read').expect(200);

        const after = await as('ana')
          .get('/notification/unread-count')
          .expect(200);
        expect(Number(after.text)).toBe(0);
      });
    });

    describe('apagar', () => {
      it('a bia não pode apagar o post da ana → 403', async () => {
        await as('bia').delete(`/posts/${postIds[0]}`).expect(403);
      });

      it('a ana apaga o próprio post e ele some', async () => {
        await as('ana').delete(`/posts/${postIds[0]}`).expect(200);
        await as('ana').get(`/posts/${postIds[0]}`).expect(404);
        const me = await as('ana').get('/user/me').expect(200);
        expect(me.body.totalPosts).toBe(2);
      });
    });
  });
});
