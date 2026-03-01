import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ExpenseResponseDto } from './expense-response.dto';

export class PaginatedExpensesResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [ExpenseResponseDto] })
  items!: ExpenseResponseDto[];
}
