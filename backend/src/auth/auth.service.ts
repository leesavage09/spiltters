import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthResponseDto } from './dto/auth-response.dto';
import { UsersService } from '../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
    const user = await this.usersService.create(email, hashedPassword);

    return { id: user.id, email: user.email, username: user.username };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { id: user.id, email: user.email, username: user.username };
  }

  async getProfile(userId: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { id: user.id, email: user.email, username: user.username };
  }

  async updateProfile(
    userId: string,
    data: { username?: string },
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.update(userId, data);
    return { id: user.id, email: user.email, username: user.username };
  }

  generateToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
