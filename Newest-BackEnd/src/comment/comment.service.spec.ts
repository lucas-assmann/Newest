import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { CommentService } from './comment.service';

describe('CommentService.remove', () => {
  let prisma: PrismaMock;
  let service: CommentService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CommentService(prisma);
  });

  it('comentário inexistente lança NotFoundException (404, não 500)', async () => {
    prisma.comment.findUnique.mockResolvedValue(null);

    await expect(service.remove('c1', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('comentário de outra pessoa lança ForbiddenException', async () => {
    prisma.comment.findUnique.mockResolvedValue({ authorId: 'outro' } as any);

    await expect(service.remove('c1', 'u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.comment.delete).not.toHaveBeenCalled();
  });
});
