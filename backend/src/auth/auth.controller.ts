import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import express from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthResponseDto> {
    const user = await this.authService.register(dto.email, dto.password);
    const token = this.authService.generateToken(user.id, user.email);

    this.setTokenCookie(res, token);

    return user;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with credentials' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthResponseDto> {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const token = this.authService.generateToken(user.id, user.email);

    this.setTokenCookie(res, token);

    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  logout(
    @Res({ passthrough: true }) res: express.Response,
  ): MessageResponseDto {
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
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async getProfile(@Req() req: AuthenticatedRequest): Promise<AuthResponseDto> {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
  ): Promise<AuthResponseDto> {
    return this.authService.updateProfile(req.user.id, dto);
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
