import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationService } from 'src/notification/notification.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let prisma: PrismaMock;
  let notifications: NotificationService;
  let service: CommentService;

  beforeEach(() => {
    prisma = createPrismaMock();
    notifications = new NotificationService(prisma);
    service = new CommentService(prisma, notifications);
  });

  describe('create', () => {
    const dto = {
      content: 'oi @ana',
      postId: '7f1d2c3a-0000-4000-8000-000000000000',
    };

    it('post inexistente → 404, sem criar comentário (antes dava 500)', async () => {
      prisma.post.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('cria, avisa o autor do post e as menções', async () => {
      prisma.post.findUnique.mockResolvedValue({ authorId: 'autor' } as any);
      prisma.comment.create.mockResolvedValue({ id: 'c1' } as any);
      const mentions = jest
        .spyOn(notifications, 'notifyMentions')
        .mockResolvedValue();

      await service.create(dto, 'u1');

      expect(prisma.notification.create.mock.calls[0][0].data).toMatchObject({
        userId: 'autor',
        type: 'COMMENT',
      });
      expect(mentions).toHaveBeenCalledWith(dto.content, 'u1', dto.postId);
    });

    it('comentar no próprio post não avisa a si mesmo', async () => {
      prisma.post.findUnique.mockResolvedValue({ authorId: 'u1' } as any);
      prisma.comment.create.mockResolvedValue({ id: 'c1' } as any);
      jest.spyOn(notifications, 'notifyMentions').mockResolvedValue();

      await service.create(dto, 'u1');

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('comentário inexistente → 404', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(service.remove('c1', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('comentário de outra pessoa → 403', async () => {
      prisma.comment.findUnique.mockResolvedValue({ authorId: 'outro' } as any);

      await expect(service.remove('c1', 'u1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });
  });
});

describe('CommentService (cobertura)', () => {
  let prisma: PrismaMock;
  let service: CommentService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CommentService(prisma, new NotificationService(prisma));
  });

  it('findOne devolve o comentário com o autor', async () => {
    prisma.comment.findUnique.mockResolvedValue({ id: 'c1' } as any);
    await expect(service.findOne('c1')).resolves.toEqual({ id: 'c1' });
    expect(prisma.comment.findUnique.mock.calls[0][0].include).toHaveProperty(
      'author',
    );
  });

  it('findOne de comentário inexistente → 404', async () => {
    prisma.comment.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('o autor apaga o próprio comentário', async () => {
    prisma.comment.findUnique.mockResolvedValue({ authorId: 'eu' } as any);
    await service.remove('c1', 'eu');
    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });

  it('findByPostId pagina do mais novo para o mais antigo', async () => {
    prisma.comment.findMany.mockResolvedValue([
      { id: 'c3' },
      { id: 'c2' },
      { id: 'c1' },
    ] as any);
    await expect(service.findByPostId('p1', { limit: 2 })).resolves.toEqual({
      items: [{ id: 'c3' }, { id: 'c2' }],
      nextCursor: 'c2',
    });
    expect(prisma.comment.findMany.mock.calls[0][0]).toMatchObject({
      where: { postId: 'p1' },
      take: 3,
    });
  });
});

describe('CommentService.update (editar comentário)', () => {
  let prisma: PrismaMock;
  let service: CommentService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CommentService(prisma, new NotificationService(prisma));
  });

  it('comentário inexistente → 404', async () => {
    prisma.comment.findUnique.mockResolvedValue(null);
    await expect(
      service.update('x', { content: 'novo' }, 'eu'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('comentário de outra pessoa → 403, sem gravar', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      authorId: 'outro',
      content: 'c',
      postId: 'p1',
    } as any);
    await expect(
      service.update('c1', { content: 'novo' }, 'eu'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.comment.update).not.toHaveBeenCalled();
  });

  it('o autor edita: grava, marca editedAt e avisa só menções novas', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      authorId: 'eu',
      content: 'oi @ana',
      postId: 'p1',
    } as any);
    prisma.comment.update.mockResolvedValue({ id: 'c1' } as any);
    prisma.user.findMany.mockResolvedValue([]);

    await service.update('c1', { content: 'oi @ana @bia' }, 'eu');

    const { data } = prisma.comment.update.mock.calls[0][0];
    expect(data.content).toBe('oi @ana @bia');
    expect(data.editedAt).toBeInstanceOf(Date);
    expect(prisma.user.findMany.mock.calls[0][0]!.where).toMatchObject({
      name: { in: ['bia'] },
    });
  });
});
