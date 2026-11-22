import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    // Mesma mensagem para email e senha errados (não revela quem tem conta).
    const passwordMatch =
      user && (await bcrypt.compare(password, user.password));
    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload: JwtPayload = { sub: user.id };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
