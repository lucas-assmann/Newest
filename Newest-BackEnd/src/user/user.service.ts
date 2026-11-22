import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { name, email, bio, password, avatar } = createUserDto;

    const emailExists = await this.prisma.user.findUnique({ where: { email } });

    if (emailExists) {
      throw new ConflictException('Email já está em uso');
    }

    const nameExists = await this.prisma.user.findUnique({ where: { name } });

    if (nameExists) {
      throw new ConflictException('Nome de usuário já está em uso');
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        bio,
        avatar,
        password: hashPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    return user;
  }

  /** Dados do próprio usuário logado (inclui o email dele). */
  async findById(userId: string) {
    const totalPosts = await this.prisma.post.count({
      where: { authorId: userId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        createdAt: true,
        bio: true,
        email: true,
      },
    });
    return { ...user, totalPosts };
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: { id: userId },
        },
      });

      if (emailExists) {
        throw new ConflictException('Email já está em uso');
      }
    }

    if (updateUserDto.name) {
      const nameExists = await this.prisma.user.findFirst({
        where: {
          name: updateUserDto.name,
          NOT: { id: userId },
        },
      });

      if (nameExists) {
        throw new ConflictException('Nome de usuário já está em uso');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  async changePassword(
    userId: string,
    { currentPassword, newPassword }: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      // 400, e não 401: um 401 faria o front deslogar o usuário.
      throw new BadRequestException('Senha atual incorreta');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  /** Busca pública: só pelo nome, sem expor email. */
  async searchUsers(query: string) {
    const results = await this.prisma.user.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 10,
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      avatar: result.avatar,
      bio: result.bio,
      totalPosts: result._count.posts,
    }));
  }

  /** Perfil público de outro usuário: sem email. */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      ...user,
      totalPosts: user._count.posts,
    };
  }

  async getUserPosts(userId: string, currentUserId?: string): Promise<any[]> {
    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        likesCount: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return posts.map((post: any): any => ({
      ...post,
      likes: post.likesCount,
      comments: post._count.comments,
      isLiked: Array.isArray(post.likes) && post.likes.length > 0,
    }));
  }

  async remove(id: string, currentUserId: string) {
    if (id !== currentUserId) {
      throw new ForbiddenException('Você só pode deletar sua própria conta');
    }

    return await this.prisma.user.delete({ where: { id } });
  }
}
