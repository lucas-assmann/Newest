import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AUTH_THROTTLER } from './auth/auth-rate-limit';
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
    // Só vale nas rotas marcadas com @AuthRateLimit() (login e cadastro).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: AUTH_THROTTLER,
            limit: config.getOrThrow<number>('AUTH_RATE_LIMIT'),
            ttl: config.getOrThrow<number>('AUTH_RATE_TTL_SECONDS') * 1000,
          },
        ],
        errorMessage: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
      }),
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
