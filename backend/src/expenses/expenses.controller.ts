import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { MessageResponseDto } from '../auth/dto/message-response.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiBody({ type: UpdateExpenseDto })
  @ApiResponse({ status: 200, type: ExpenseResponseDto })
  async update(
    @Param('splitId') splitId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(req.user.id, splitId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async delete(
    @Param('splitId') splitId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<MessageResponseDto> {
    return this.expensesService.delete(req.user.id, splitId, id);
  }
}
