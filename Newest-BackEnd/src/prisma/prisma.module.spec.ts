import { MODULE_METADATA } from '@nestjs/common/constants';
import { CommentModule } from 'src/comment/comment.module';
import { NotificationModule } from 'src/notification/notification.module';
import { PostsModule } from 'src/posts/posts.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from './prisma.module';
import { PrismaService } from './prisma.service';

describe('PrismaModule', () => {
  it('é global e exporta o PrismaService', () => {
    expect(Reflect.getMetadata('__module:global__', PrismaModule)).toBe(true);
    expect(
      Reflect.getMetadata(MODULE_METADATA.EXPORTS, PrismaModule),
    ).toContain(PrismaService);
  });

  it.each([
    UserModule,
    PostsModule,
    CommentModule,
    NotificationModule,
    AuthModule,
  ])('%p não cria um PrismaService próprio (antes eram 5 conexões)', (mod) => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, mod) ?? [];
    expect(providers).not.toContain(PrismaService);
  });
});
