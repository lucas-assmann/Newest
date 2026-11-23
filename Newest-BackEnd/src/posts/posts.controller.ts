import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthUser } from 'src/auth/current-user.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { PaginationQueryDto } from 'src/common/pagination';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.postsService.create(createPostDto, user.id);
  }

  @Get('me')
  getMyPosts(@CurrentUser() user: AuthUser, @Query() page: PaginationQueryDto) {
    return this.postsService.findByUserId(user.id, user.id, page);
  }

  @Get()
  getAllPosts(
    @CurrentUser() user: AuthUser,
    @Query() page: PaginationQueryDto,
  ) {
    return this.postsService.getAllPosts(user.id, page);
  }

  @Get('user/:userId')
  getUserPosts(
    @Param('userId') userId: string,
    @CurrentUser() user: AuthUser,
    @Query() page: PaginationQueryDto,
  ) {
    return this.postsService.findByUserId(userId, user.id, page);
  }

  @Get(':id')
  getPostById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.findOne(id, user.id);
  }

  @Patch(':postId/like')
  toggleLike(@Param('postId') postId: string, @CurrentUser() user: AuthUser) {
    return this.postsService.toggleLike(postId, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(id, user.id);
  }
}
