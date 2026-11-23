import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthUser } from 'src/auth/current-user.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { PaginationQueryDto } from 'src/common/pagination';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentService.create(createCommentDto, user.id);
  }

  @Get('post/:postId')
  findByPostId(
    @Param('postId') postId: string,
    @Query() page: PaginationQueryDto,
  ) {
    return this.commentService.findByPostId(postId, page);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.commentService.remove(id, user.id);
  }
}
