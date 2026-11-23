import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { PostsService } from './posts.service';

describe('PostsService.toggleLike', () => {
  let prisma: PrismaMock;
  let service: PostsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    // A transação roda a função com o próprio mock como "tx".
    prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    prisma.post.findUnique.mockResolvedValue({
      id: 'p1',
      authorId: 'autor',
    } as any);
    service = new PostsService(
      prisma,
      { get: () => undefined } as unknown as ConfigService,
      new NotificationService(prisma),
    );
  });

  it('post inexistente → 404', async () => {
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(service.toggleLike('p1', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('curtir: cria o like, soma 1 e avisa o autor — tudo numa transação', async () => {
    prisma.like.findUnique.mockResolvedValue(null);
    prisma.post.update.mockResolvedValue({ id: 'p1', likesCount: 5 } as any);

    const result = await service.toggleLike('p1', 'u1');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.like.create).toHaveBeenCalled();
    expect(prisma.post.update.mock.calls[0][0].data).toEqual({
      likesCount: { increment: 1 },
    });
    expect(prisma.notification.create.mock.calls[0][0].data).toMatchObject({
      userId: 'autor',
      actorId: 'u1',
      type: 'LIKE',
    });
    expect(result).toMatchObject({ isLiked: true, likesCount: 5 });
  });

  it('curtir o próprio post não gera notificação', async () => {
    prisma.like.findUnique.mockResolvedValue(null);
    prisma.post.update.mockResolvedValue({ id: 'p1', likesCount: 1 } as any);

    await service.toggleLike('p1', 'autor');

    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('descurtir: apaga o like e a notificação e tira 1', async () => {
    prisma.like.findUnique.mockResolvedValue({ id: 'l1' } as any);
    prisma.post.update.mockResolvedValue({ id: 'p1', likesCount: 4 } as any);

    const result = await service.toggleLike('p1', 'u1');

    expect(prisma.like.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
    expect(prisma.notification.deleteMany).toHaveBeenCalled();
    expect(prisma.post.update.mock.calls[0][0].data).toEqual({
      likesCount: { decrement: 1 },
    });
    expect(result).toMatchObject({ isLiked: false, likesCount: 4 });
  });

  it.each(['P2002', 'P2025'])(
    'clique duplo (erro %s do Prisma) devolve o estado atual em vez de 500',
    async (code) => {
      prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('conflito', {
          code,
          clientVersion: 'teste',
        }),
      );
      prisma.like.findUnique.mockResolvedValue({ id: 'l1' } as any);
      prisma.post.findUniqueOrThrow.mockResolvedValue({
        id: 'p1',
        likesCount: 3,
      } as any);

      await expect(service.toggleLike('p1', 'u1')).resolves.toMatchObject({
        isLiked: true,
        likesCount: 3,
      });
    },
  );

  it('outros erros continuam subindo', async () => {
    prisma.$transaction.mockRejectedValue(new Error('banco caiu'));

    await expect(service.toggleLike('p1', 'u1')).rejects.toThrow('banco caiu');
  });
});
