import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MessageResponseDto } from '../auth/dto/message-response.dto';
import { SplitResponseDto } from './dto/split-response.dto';
import type { UpdateSplitDto } from './dto/update-split.dto';
import { UserSafeException } from 'src/common/errors/useSafeError';

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

  async update(
    userId: string,
    splitId: string,
    data: UpdateSplitDto,
  ): Promise<SplitResponseDto> {
    const existing = await this.prisma.split.findUnique({
      where: { id: splitId },
      include: { users: { include: { user: true } } },
    });

    if (!existing || !existing.users.some((u) => u.userId === userId))
      throw new UserSafeException('Split not found');

    const split = await this.prisma.split.update({
      where: { id: splitId },
      data,
      include: { users: { include: { user: true } } },
    });

    return this.toResponseDto(split, userId);
  }

  async delete(userId: string, splitId: string): Promise<MessageResponseDto> {
    const split = await this.prisma.split.findUnique({
      where: { id: splitId },
      include: { users: true },
    });

    if (!split || !split.users.some((u) => u.userId === userId))
      throw new UserSafeException('Split not found');

    if (split.users.length > 1)
      throw new UserSafeException(
        'Cannot delete a split that has other members',
      );

    await this.prisma.splitUser.deleteMany({ where: { splitId } });
    await this.prisma.split.delete({ where: { id: splitId } });

    return { message: 'Split deleted' };
  }

  private toResponseDto(
    split: {
      id: string;
      name: string;
      emoji: string;
      createdAt: Date;
      updatedAt: Date;
      users: {
        user: { id: string; email: string; username: string | null };
      }[];
    },
    currentUserId: string,
  ): SplitResponseDto {
    return {
      id: split.id,
      name: split.name,
      emoji: split.emoji,
      users: split.users
        .filter((su) => su.user.id !== currentUserId)
        .map((su) => ({
          id: su.user.id,
          email: su.user.email,
          username: su.user.username,
        })),
      createdAt: split.createdAt,
      updatedAt: split.updatedAt,
    };
  }
}
