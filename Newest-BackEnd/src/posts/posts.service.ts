import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Like } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private readonly logger = new Logger(PostsService.name);

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

    let data: any;
    try {
      // POST com o segredo no corpo, para ele não aparecer em logs de URL.
      const response = await fetch('https://api.sightengine.com/1.0/check.json', {
        method: 'POST',
        body: new URLSearchParams({
          url: imageUrl,
          models: 'nudity,violence',
          api_user: apiUser,
          api_secret: apiSecret,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    } catch (error) {
      this.logger.error(`Falha ao chamar o Sightengine: ${String(error)}`);
      throw unavailable;
    }

    if (data?.status !== 'success') {
      this.logger.error(`Sightengine respondeu falha: ${data?.error?.message}`);
      throw unavailable;
    }

    return !(
      data.nudity?.raw > 0.5 ||
      data.nudity?.partial > 0.7 ||
      data.violence?.prob > 0.7
    );
  }

  async toggleLike(postId: string, userId: string) {
    const existingLike: Like | null = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      await this.prisma.notification.deleteMany({
        where: {
          actorId: userId,
          postId,
          type: 'like',
        },
      });

      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
        select: {
          id: true,
          likesCount: true,
        },
      });

      return {
        liked: false,
        message: 'Like removido',
        postId: updatedPost.id,
        likesCount: updatedPost.likesCount,
        isLiked: false,
      };
    } else {
      await this.prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
        select: {
          id: true,
          likesCount: true,
          authorId: true,
        },
      });

      if (updatedPost.authorId !== userId) {
        await this.prisma.notification.create({
          data: {
            userId: updatedPost.authorId,
            actorId: userId,
            type: 'like',
            postId,
          },
        });
      }

      return {
        liked: true,
        message: 'Like adicionado',
        postId: updatedPost.id,
        likesCount: updatedPost.likesCount,
        isLiked: true,
      };
    }
  }

  async getAllPosts(currentUserId?: string) {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        likesCount: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true, userId: true, postId: true },
            }
          : false,
        _count: { select: { comments: true } },
      },
    });

    return posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      images: post.images,
      likes: post.likesCount,
      comments: post._count.comments,
      createdAt: post.createdAt,
      author: post.author,
      isLiked: post.likes ? post.likes.length > 0 : false,
    }));
  }

  async findByUserId(userId: string, currentUserId?: string) {
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        likesCount: true,
        images: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
        _count: { select: { comments: true } },
      },
    });

    return posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      images: post.images,
      likes: post.likesCount,
      comments: post._count.comments,
      createdAt: post.createdAt,
      author: post.author,
      isLiked: post.likes ? post.likes.length > 0 : false,
    }));
  }

  async findOne(postId: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        content: true,
        likesCount: true,
        images: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
        _count: { select: { comments: true } },
      },
    });

    if (!post) throw new NotFoundException('Post não encontrado');

    return {
      ...post,
      likes: post.likesCount,
      comments: post._count.comments,
      isLiked: Array.isArray(post.likes) && post.likes.length > 0,
    };
  }

  async create(createPostDto: CreatePostDto, userId: string) {
    if (createPostDto.images && createPostDto.images.length > 0) {
      const results = await Promise.all(
        createPostDto.images.map((url) => this.isImageSafe(url)),
      );

      if (results.some((r) => r === false)) {
        throw new BadRequestException(
          'Uma ou mais imagens contêm conteúdo não permitido',
        );
      }
    }

    const post = await this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId: userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        likesCount: true,
        images: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        _count: { select: { comments: true } },
      },
    });

    const mentions = createPostDto.content.match(/@(\w+)/g);
    if (mentions) {
      const usernames = mentions.map((m) => m.slice(1));
      const mentionedUsers = await this.prisma.user.findMany({
        where: { name: { in: usernames }, NOT: { id: userId } },
        select: { id: true },
      });

      await Promise.all(
        mentionedUsers.map((user) =>
          this.prisma.notification.create({
            data: {
              userId: user.id,
              actorId: userId,
              type: 'mention',
              postId: post.id,
            },
          }),
        ),
      );
    }

    return {
      ...post,
      likes: post.likesCount,
      comments: post._count.comments,
    };
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

    return await this.prisma.post.delete({ where: { id } });
  }
}
