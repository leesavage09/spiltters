import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserSafeException } from 'src/common/errors/useSafeError';
import type { CreateExpenseDto } from './dto/create-expense.dto';
import type { UpdateExpenseDto } from './dto/update-expense.dto';
import type { ExpenseResponseDto } from './dto/expense-response.dto';
import type { MessageResponseDto } from '../auth/dto/message-response.dto';
import type { PaginatedExpensesResponseDto } from './dto/paginated-expenses-response.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySplit(
    userId: string,
    splitId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedExpensesResponseDto> {
    await this.assertSplitMembership(userId, splitId);

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where: { splitId },
        orderBy: { date: 'desc' },
        skip,
        take,
        include: {
          paidBy: true,
          shares: { include: { user: true } },
        },
      }),
      this.prisma.expense.count({ where: { splitId } }),
    ]);

    return {
      items: expenses.map((e) => this.toResponseDto(e)),
      total,
      hasMore: skip + take < total,
    };
  }

  async create(
    userId: string,
    splitId: string,
    dto: CreateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const split = await this.assertSplitMembership(userId, splitId);
    this.validateExpensePayload(dto, split);

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

  async update(
    userId: string,
    splitId: string,
    expenseId: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    const split = await this.assertSplitMembership(userId, splitId);
    await this.assertExpenseExists(expenseId, splitId);
    this.validateExpensePayload(dto, split);

    const expense = await this.prisma.$transaction(async (tx) => {
      await tx.expenseShare.deleteMany({ where: { expenseId } });

      return tx.expense.update({
        where: { id: expenseId },
        data: {
          title: dto.title,
          amount: dto.amount,
          currency: dto.currency,
          date: new Date(dto.date),
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
    });

    return this.toResponseDto(expense);
  }

  async delete(
    userId: string,
    splitId: string,
    expenseId: string,
  ): Promise<MessageResponseDto> {
    await this.assertSplitMembership(userId, splitId);
    await this.assertExpenseExists(expenseId, splitId);

    await this.prisma.expense.delete({ where: { id: expenseId } });

    return { message: 'Expense deleted' };
  }

  private async assertSplitMembership(userId: string, splitId: string) {
    const split = await this.prisma.split.findUnique({
      where: { id: splitId },
      include: { users: true },
    });

    if (!split || !split.users.some((u) => u.userId === userId))
      throw new UserSafeException('Split not found');

    return split;
  }

  private async assertExpenseExists(expenseId: string, splitId: string) {
    const existing = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!existing || existing.splitId !== splitId)
      throw new UserSafeException('Expense not found');

    return existing;
  }

  private validateExpensePayload(
    dto: CreateExpenseDto | UpdateExpenseDto,
    split: { users: { userId: string }[] },
  ) {
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
  }

  private toResponseDto(expense: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
    paidBy: { id: string; email: string; username: string | null };
    shares: {
      userId: string;
      amount: number;
      user: { email: string; username: string | null };
    }[];
  }): ExpenseResponseDto {
    return {
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      paidBy: {
        id: expense.paidBy.id,
        email: expense.paidBy.email,
        username: expense.paidBy.username,
      },
      shares: expense.shares.map((s) => ({
        userId: s.userId,
        email: s.user.email,
        username: s.user.username,
        amount: s.amount,
      })),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
