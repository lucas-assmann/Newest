import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  /** Usado pelo front para "acordar" o servidor no Render. */
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
