import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserSafeException } from 'src/common/errors/useSafeError';
import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { ExpenseResponseDto } from './dto/expense-response.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    splitId: string,
    dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const split = await this.prisma.split.findUnique({
      where: { id: splitId },
      include: { users: true },
    });

    if (!split || !split.users.some((u) => u.userId === userId))
      throw new UserSafeException('Split not found');

    const memberIds = new Set(split.users.map((u) => u.userId));

    if (!memberIds.has(dto.paidBy))
      throw new UserSafeException('Paid-by user is not a member of this split');

    for (const share of dto.shares) {
      if (!memberIds.has(share.userId))
        throw new UserSafeException(
          `User ${share.userId} is not a member of this split`,
        );
    }

    const sharesTotal = dto.shares.reduce((sum, s) => sum + s.amount, 0);
    if (sharesTotal !== dto.amount)
      throw new UserSafeException('Shares must sum to the total amount');

    const expense = await this.prisma.expense.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        currency: dto.currency,
        date: new Date(dto.date),
        splitId,
        paidById: dto.paidBy,
        shares: {
          create: dto.shares.map((s) => ({
            userId: s.userId,
            amount: s.amount,
          })),
        },
      },
      include: {
        paidBy: true,
        shares: { include: { user: true } },
      },
    });

    return this.toResponseDto(expense);
  }

  private toResponseDto(expense: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
    paidBy: { id: string; email: string };
    shares: { userId: string; amount: number; user: { email: string } }[];
  }): ExpenseResponseDto {
    return {
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      paidBy: { id: expense.paidBy.id, email: expense.paidBy.email },
      shares: expense.shares.map((s) => ({
        userId: s.userId,
        email: s.user.email,
        amount: s.amount,
      })),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
