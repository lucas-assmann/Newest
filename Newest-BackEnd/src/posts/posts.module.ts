import { Module } from '@nestjs/common';
import { NotificationModule } from 'src/notification/notification.module';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [NotificationModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
