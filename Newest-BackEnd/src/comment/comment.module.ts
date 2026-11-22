import { Module } from '@nestjs/common';
import { NotificationModule } from 'src/notification/notification.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [NotificationModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
