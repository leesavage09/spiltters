import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SplitResponseDto } from './dto/split-response.dto';

//TODO Unsafe assignment of an error typed value, need to fix that

@Injectable()
export class SplitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<SplitResponseDto[]> {
    const splits = await this.prisma.split.findMany({
      where: { users: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
      include: { users: { include: { user: true } } },
    });

    return splits.map((split) => this.toResponseDto(split, userId));
  }

  async create(
    userId: string,
    name: string,
    emoji: string,
  ): Promise<SplitResponseDto> {
    const split = await this.prisma.split.create({
      data: {
        name,
        emoji,
        users: { create: { userId } },
      },
      include: { users: { include: { user: true } } },
    });

    return this.toResponseDto(split, userId);
  }

  private toResponseDto(
    split: {
      id: string;
      name: string;
      emoji: string;
      createdAt: Date;
      updatedAt: Date;
      users: { user: { id: string; email: string } }[];
    },
    currentUserId: string,
  ): SplitResponseDto {
    return {
      id: split.id,
      name: split.name,
      emoji: split.emoji,
      users: split.users
        .filter((su) => su.user.id !== currentUserId)
        .map((su) => ({ id: su.user.id, email: su.user.email })),
      createdAt: split.createdAt,
      updatedAt: split.updatedAt,
    };
  }
}
