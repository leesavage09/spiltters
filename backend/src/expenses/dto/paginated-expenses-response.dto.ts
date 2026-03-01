import { ApiProperty } from '@nestjs/swagger';
import { ExpenseResponseDto } from './expense-response.dto';

export class PaginatedExpensesResponseDto {
  @ApiProperty({ type: [ExpenseResponseDto] })
  items!: ExpenseResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  hasMore!: boolean;
}
