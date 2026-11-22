import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { AuthUser } from 'src/auth/current-user.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
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
  getMyPosts(@CurrentUser() user: AuthUser) {
    return this.postsService.findByUserId(user.id, user.id);
  }

  @Get()
  getAllPosts(@CurrentUser() user: AuthUser) {
    return this.postsService.getAllPosts(user.id);
  }

  @Get('user/:userId')
  getUserPosts(@Param('userId') userId: string, @CurrentUser() user: AuthUser) {
    return this.postsService.findByUserId(userId, user.id);
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
