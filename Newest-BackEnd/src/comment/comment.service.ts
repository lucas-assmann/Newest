import { NotificationType } from '@prisma/client';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  newestFirst,
  pageArgs,
  Pagination,
  toPage,
} from 'src/common/pagination';
import { NotificationService } from 'src/notification/notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

const authorSelect = {
  author: { select: { id: true, name: true, avatar: true } },
} as const;

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  async create({ content, postId }: CreateCommentDto, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    const comment = await this.prisma.comment.create({
      data: { content, postId, authorId: userId },
      include: authorSelect,
    });

    if (post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: post.authorId,
          actorId: userId,
          type: NotificationType.COMMENT,
          postId,
        },
      });
    }

    await this.notifications.notifyMentions(content, userId, postId);

    return comment;
  }

  async findByPostId(postId: string, page: Pagination = {}) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: newestFirst,
      include: authorSelect,
      ...pageArgs(page),
    });
    return toPage(comments, page);
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: authorSelect,
    });
    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }
    return comment;
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comentário não encontrado');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este comentário',
      );
    }

    return this.prisma.comment.delete({ where: { id } });
  }
}
