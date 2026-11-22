import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { validateEnv } from './config/env';
import { NotificationModule } from './notification/notification.module';
import { PostsModule } from './posts/posts.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // Nos testes, usa só as variáveis falsas (nunca o .env com o banco real).
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    PostsModule,
    CommentModule,
    NotificationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
