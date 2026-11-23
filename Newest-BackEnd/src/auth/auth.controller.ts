import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthRateLimit } from './auth-rate-limit';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @AuthRateLimit()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
