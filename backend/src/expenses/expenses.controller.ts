import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { PaginatedExpensesResponseDto } from './dto/paginated-expenses-response.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@Controller('splits/:splitId/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses for a split' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedExpensesResponseDto })
  async findBySplit(
    @Param('splitId') splitId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<PaginatedExpensesResponseDto> {
    return this.expensesService.findBySplit(
      req!.user.id,
      splitId,
      parseInt(skip || '0', 10),
      parseInt(take || '20', 10),
    );
  }

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
