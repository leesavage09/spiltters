import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import express from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

interface AuthResponse {
  id: string;
  email: string;
}

interface MessageResponse {
  message: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthResponse> {
    const user = await this.authService.register(dto.email, dto.password);
    const token = this.authService.generateToken(user.id, user.email);

    this.setTokenCookie(res, token);

    return user;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthResponse> {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const token = this.authService.generateToken(user.id, user.email);

    this.setTokenCookie(res, token);

    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: express.Response): MessageResponse {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): AuthenticatedUser {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return req.user as AuthenticatedUser;
  }

  private setTokenCookie(res: express.Response, token: string): void {
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
