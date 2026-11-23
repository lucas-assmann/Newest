import { NotificationType } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import {
  newestFirst,
  pageArgs,
  Pagination,
  toPage,
} from 'src/common/pagination';
import { PrismaService } from 'src/prisma/prisma.service';

/** Nomes citados com @ no texto, sem repetir. */
export function extractMentions(content: string): string[] {
  const names = [...content.matchAll(/@(\w+)/g)].map((m) => m[1]);
  return [...new Set(names)];
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /** Avisa quem foi mencionado num post ou comentário (antes duplicado nos dois). */
  async notifyMentions(content: string, actorId: string, postId: string) {
    const names = extractMentions(content);
    if (names.length === 0) return;

    const mentioned = await this.prisma.user.findMany({
      where: { name: { in: names }, NOT: { id: actorId } },
      select: { id: true },
    });
    if (mentioned.length === 0) return;

    await this.prisma.notification.createMany({
      data: mentioned.map((user) => ({
        userId: user.id,
        actorId,
        type: NotificationType.MENTION,
        postId,
      })),
    });
  }

  async findByUserId(userId: string, page: Pagination = {}) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        NOT: { actorId: userId },
      },
      orderBy: newestFirst,
      ...pageArgs(page),
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    return toPage(notifications, page);
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false, NOT: { actorId: userId } },
    });
  }
}
