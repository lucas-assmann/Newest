import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationType, Prisma } from '@prisma/client';
import {
  newestFirst,
  pageArgs,
  Pagination,
  toPage,
} from 'src/common/pagination';
import { NotificationService } from 'src/notification/notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { postSelect, toPostDto } from './post.mapper';

/** Parte da resposta do Sightengine que usamos. */
interface SightengineResponse {
  status?: string;
  error?: { message?: string };
  nudity?: { raw?: number; partial?: number };
  violence?: { prob?: number };
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notifications: NotificationService,
  ) {}

  /**
   * Verifica a imagem no Sightengine. Se a verificação não puder ser feita
   * (sem credenciais, erro de rede ou resposta de falha), RECUSA o post:
   * nunca publica uma imagem que não foi verificada.
   */
  private async isImageSafe(imageUrl: string): Promise<boolean> {
    const apiUser = this.configService.get<string>('SIGHTENGINE_USER');
    const apiSecret = this.configService.get<string>('SIGHTENGINE_SECRET');
    const unavailable = new ServiceUnavailableException(
      'Não foi possível verificar as imagens agora. Tente novamente mais tarde.',
    );

    if (!apiUser || !apiSecret) {
      this.logger.error('SIGHTENGINE_USER/SIGHTENGINE_SECRET não configurados');
      throw unavailable;
    }

    let data: SightengineResponse;
    try {
      // POST com o segredo no corpo, para ele não aparecer em logs de URL.
      const response = await fetch(
        'https://api.sightengine.com/1.0/check.json',
        {
          method: 'POST',
          body: new URLSearchParams({
            url: imageUrl,
            models: 'nudity,violence',
            api_user: apiUser,
            api_secret: apiSecret,
          }),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = (await response.json()) as SightengineResponse;
    } catch (error) {
      this.logger.error(`Falha ao chamar o Sightengine: ${String(error)}`);
      throw unavailable;
    }

    if (data?.status !== 'success') {
      this.logger.error(`Sightengine respondeu falha: ${data?.error?.message}`);
      throw unavailable;
    }

    return !(
      (data.nudity?.raw ?? 0) > 0.5 ||
      (data.nudity?.partial ?? 0) > 0.7 ||
      (data.violence?.prob ?? 0) > 0.7
    );
  }

  /** Estado do like depois da operação (também usado após um clique duplo). */
  private async likeState(postId: string, userId: string) {
    const [like, post] = await Promise.all([
      this.prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
        select: { id: true },
      }),
      this.prisma.post.findUniqueOrThrow({
        where: { id: postId },
        select: { id: true, likesCount: true },
      }),
    ]);
    return this.likeResponse(post.id, post.likesCount, !!like);
  }

  private likeResponse(postId: string, likesCount: number, isLiked: boolean) {
    return {
      liked: isLiked,
      isLiked,
      message: isLiked ? 'Like adicionado' : 'Like removido',
      postId,
      likesCount,
    };
  }

  async toggleLike(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });
    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    try {
      // Tudo ou nada: like, contador e notificação nunca ficam fora de sincronia.
      return await this.prisma.$transaction(async (tx) => {
        const existingLike = await tx.like.findUnique({
          where: { userId_postId: { userId, postId } },
          select: { id: true },
        });

        if (existingLike) {
          await tx.like.delete({ where: { id: existingLike.id } });
          await tx.notification.deleteMany({
            where: { actorId: userId, postId, type: NotificationType.LIKE },
          });
          const updated = await tx.post.update({
            where: { id: postId },
            data: { likesCount: { decrement: 1 } },
            select: { id: true, likesCount: true },
          });
          return this.likeResponse(updated.id, updated.likesCount, false);
        }

        await tx.like.create({ data: { userId, postId } });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
          select: { id: true, likesCount: true },
        });
        if (post.authorId !== userId) {
          await tx.notification.create({
            data: {
              userId: post.authorId,
              actorId: userId,
              type: NotificationType.LIKE,
              postId,
            },
          });
        }
        return this.likeResponse(updated.id, updated.likesCount, true);
      });
    } catch (error) {
      // Clique duplo: outra requisição já criou (P2002) ou apagou (P2025) o like.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2025'].includes(error.code)
      ) {
        return this.likeState(postId, userId);
      }
      throw error;
    }
  }

  async getAllPosts(currentUserId: string, page: Pagination = {}) {
    const posts = await this.prisma.post.findMany({
      orderBy: newestFirst,
      select: postSelect(currentUserId),
      ...pageArgs(page),
    });
    return toPage(posts.map(toPostDto), page);
  }

  async findByUserId(
    userId: string,
    currentUserId: string,
    page: Pagination = {},
  ) {
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: newestFirst,
      select: postSelect(currentUserId),
      ...pageArgs(page),
    });
    return toPage(posts.map(toPostDto), page);
  }

  async findOne(postId: string, currentUserId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: postSelect(currentUserId),
    });
    if (!post) throw new NotFoundException('Post não encontrado');
    return toPostDto(post);
  }

  async create(createPostDto: CreatePostDto, userId: string) {
    if (createPostDto.images && createPostDto.images.length > 0) {
      const results = await Promise.all(
        createPostDto.images.map((url) => this.isImageSafe(url)),
      );

      if (results.some((safe) => !safe)) {
        throw new BadRequestException(
          'Uma ou mais imagens contêm conteúdo não permitido',
        );
      }
    }

    const post = await this.prisma.post.create({
      data: { ...createPostDto, authorId: userId },
      select: postSelect(userId),
    });

    await this.notifications.notifyMentions(
      createPostDto.content,
      userId,
      post.id,
    );

    return toPostDto(post);
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!post) {
      throw new NotFoundException('Post não encontrado');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este post',
      );
    }

    return this.prisma.post.delete({ where: { id } });
  }
}
