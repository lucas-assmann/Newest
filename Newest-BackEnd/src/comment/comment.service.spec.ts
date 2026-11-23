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
