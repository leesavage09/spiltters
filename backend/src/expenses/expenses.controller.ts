import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@Controller('splits/:splitId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an expense in a split' })
  @ApiBody({ type: CreateExpenseDto })
  @ApiResponse({ status: 201, type: ExpenseResponseDto })
  async create(
    @Param('splitId') splitId: string,
    @Body() dto: CreateExpenseDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.create(req.user.id, splitId, dto);
  }
}
