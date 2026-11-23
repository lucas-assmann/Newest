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
import { AuthRateLimit } from 'src/auth/auth-rate-limit';
import type { AuthUser } from 'src/auth/current-user.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Public } from 'src/auth/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

// As imagens (avatar) são enviadas pelo front direto ao Cloudinary;
// aqui só chega a URL, validada no DTO.
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @AuthRateLimit()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.userService.findById(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(user.id, updateUserDto);
  }

  @Patch('me/password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(user.id, dto);
  }

  @Delete('me')
  removeMyAccount(@CurrentUser() user: AuthUser) {
    return this.userService.remove(user.id);
  }

  @Get('search')
  searchUsers(@Query('q') query?: string) {
    if (!query?.trim()) return [];
    return this.userService.searchUsers(query.trim());
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
