import { ApiProperty } from '@nestjs/swagger';

export class ExpensePaidByResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;
}

export class ExpenseShareResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ description: 'Amount in pence/cents' })
  amount!: number;
}

export class ExpenseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ description: 'Total amount in pence/cents' })
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  date!: Date;

  @ApiProperty({ type: ExpensePaidByResponseDto })
  paidBy!: ExpensePaidByResponseDto;

  @ApiProperty({ type: [ExpenseShareResponseDto] })
  shares!: ExpenseShareResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
