import { Controller, Get, Patch, Query } from '@nestjs/common';
import type { AuthUser } from 'src/auth/current-user.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { PaginationQueryDto } from 'src/common/pagination';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() page: PaginationQueryDto) {
    return this.notificationService.findByUserId(user.id, page);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Patch('mark-all-read')
  markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationService.markAllAsRead(user.id);
  }
}
