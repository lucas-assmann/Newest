import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from 'src/notification/notification.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { CreatePostSchema } from './dto/create-post.dto';
import { PostsService } from './posts.service';

const img = 'https://res.cloudinary.com/demo/image/upload/v1/post.jpg';

function sightengineResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

const safe = {
  status: 'success',
  nudity: { raw: 0.01, partial: 0.01 },
  violence: { prob: 0.01 },
};

describe('PostsService', () => {
  let prisma: PrismaMock;
  let fetchMock: jest.SpyInstance;

  function makeService(env: Record<string, string> = {}) {
    const config = { get: (key: string) => env[key] } as ConfigService;
    return new PostsService(prisma, config, new NotificationService(prisma));
  }

  const creds = { SIGHTENGINE_USER: 'u', SIGHTENGINE_SECRET: 's3cr3t' };

  beforeEach(() => {
    prisma = createPrismaMock();
    prisma.post.create.mockResolvedValue({
      id: 'p1',
      likesCount: 0,
      likes: [],
      author: { id: 'u1', name: 'ana', avatar: null },
      _count: { comments: 0 },
    } as any);
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchMock.mockRestore());

  describe('moderação de imagem (create)', () => {
    const dto = { title: 't', content: 'c', images: [img] };

    it('sem credenciais do Sightengine recusa em vez de liberar', async () => {
      await expect(makeService().create(dto, 'u1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(prisma.post.create).not.toHaveBeenCalled();
    });

    it('se o Sightengine responder erro HTTP, recusa', async () => {
      fetchMock.mockResolvedValue(sightengineResponse({}, false));

      await expect(makeService(creds).create(dto, 'u1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(prisma.post.create).not.toHaveBeenCalled();
    });

    it('se o Sightengine devolver status de falha, recusa', async () => {
      fetchMock.mockResolvedValue(
        sightengineResponse({ status: 'failure', error: { message: 'x' } }),
      );

      await expect(makeService(creds).create(dto, 'u1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('se a rede falhar, recusa', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      await expect(makeService(creds).create(dto, 'u1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('imagem imprópria lança BadRequestException', async () => {
      fetchMock.mockResolvedValue(
        sightengineResponse({ ...safe, nudity: { raw: 0.9, partial: 0 } }),
      );

      await expect(makeService(creds).create(dto, 'u1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.post.create).not.toHaveBeenCalled();
    });

    it('imagem segura cria o post, e o segredo não vai na URL', async () => {
      fetchMock.mockResolvedValue(sightengineResponse(safe));

      await makeService(creds).create(dto, 'u1');

      expect(prisma.post.create).toHaveBeenCalled();
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).not.toContain('s3cr3t');
      expect(init?.method).toBe('POST');
    });

    it('post sem imagem não chama o Sightengine', async () => {
      await makeService().create({ title: 't', content: 'c' }, 'u1');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(prisma.post.create).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('post inexistente lança NotFoundException (404, não 500)', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(makeService().remove('p1', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('post de outra pessoa lança ForbiddenException (403, não 401)', async () => {
      prisma.post.findUnique.mockResolvedValue({ authorId: 'outro' } as any);

      await expect(makeService().remove('p1', 'u1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.post.delete).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('post inexistente lança NotFoundException', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(makeService().findOne('p1', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

describe('CreatePostSchema', () => {
  it('aceita imagens do Cloudinary e recusa outras URLs', () => {
    const base = { title: 't', content: 'c' };
    expect(CreatePostSchema.safeParse({ ...base, images: [img] }).success).toBe(
      true,
    );
    expect(
      CreatePostSchema.safeParse({
        ...base,
        images: ['https://site-qualquer.com/x.jpg'],
      }).success,
    ).toBe(false);
    expect(
      CreatePostSchema.safeParse({ ...base, images: ['não é url'] }).success,
    ).toBe(false);
  });
});

describe('PostsService (cobertura)', () => {
  let prisma: PrismaMock;
  let service: PostsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    const config = { get: () => undefined } as unknown as ConfigService;
    service = new PostsService(prisma, config, new NotificationService(prisma));
  });

  const row = {
    id: 'p1',
    title: 't',
    content: 'c',
    images: [],
    createdAt: new Date('2026-11-22T00:00:00Z'),
    likesCount: 2,
    likes: [{ id: 'l1' }],
    author: { id: 'u1', name: 'ana', avatar: null },
    _count: { comments: 5 },
  };

  it('findOne devolve o post no formato do front', async () => {
    prisma.post.findUnique.mockResolvedValue(row as any);
    await expect(service.findOne('p1', 'u2')).resolves.toMatchObject({
      id: 'p1',
      likes: 2,
      comments: 5,
      isLiked: true,
    });
  });

  it('findOne de post inexistente → 404', async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('o autor apaga o próprio post', async () => {
    prisma.post.findUnique.mockResolvedValue({ authorId: 'u1' } as any);
    await service.remove('p1', 'u1');
    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });

  it('feed pagina: com cursor começa depois dele', async () => {
    prisma.post.findMany.mockResolvedValue([row] as any);
    const page = await service.getAllPosts('u1', { limit: 1, cursor: 'p0' });
    expect(page.nextCursor).toBeNull();
    expect(prisma.post.findMany.mock.calls[0][0]).toMatchObject({
      cursor: { id: 'p0' },
      skip: 1,
      take: 2,
    });
  });
});

describe('PostsService.update (editar post)', () => {
  let prisma: PrismaMock;
  let service: PostsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    const config = { get: () => undefined } as unknown as ConfigService;
    service = new PostsService(prisma, config, new NotificationService(prisma));
    prisma.post.update.mockResolvedValue({
      id: 'p1',
      likes: [],
      _count: { comments: 0 },
      author: { id: 'eu', name: 'eu', avatar: null },
    } as any);
  });

  it('post inexistente → 404', async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    await expect(
      service.update('x', { title: 'novo' }, 'eu'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('post de outra pessoa → 403, sem gravar', async () => {
    prisma.post.findUnique.mockResolvedValue({
      authorId: 'outro',
      content: 'c',
    } as any);
    await expect(
      service.update('p1', { title: 'novo' }, 'eu'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it('o autor edita: grava o texto e marca editedAt', async () => {
    prisma.post.findUnique.mockResolvedValue({
      authorId: 'eu',
      content: 'antigo',
    } as any);

    await service.update('p1', { title: 'novo' }, 'eu');

    const { data } = prisma.post.update.mock.calls[0][0];
    expect(data).toMatchObject({ title: 'novo' });
    expect(data.editedAt).toBeInstanceOf(Date);
    expect(data).not.toHaveProperty('images');
  });

  it('avisa só quem foi mencionado agora (não repete quem já estava)', async () => {
    prisma.post.findUnique.mockResolvedValue({
      authorId: 'eu',
      content: 'oi @ana',
    } as any);
    prisma.user.findMany.mockResolvedValue([{ id: 'bia-id' }] as any);

    await service.update('p1', { content: 'oi @ana e @bia' }, 'eu');

    expect(prisma.user.findMany.mock.calls[0][0]!.where).toMatchObject({
      name: { in: ['bia'] },
    });
  });

  it('mudar só o título não gera notificação de menção', async () => {
    prisma.post.findUnique.mockResolvedValue({
      authorId: 'eu',
      content: 'oi @ana',
    } as any);
    await service.update('p1', { title: 'novo' }, 'eu');
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
