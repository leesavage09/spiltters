import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ExpenseShareDto {
  @ApiProperty({ example: 'clxyz123' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 1250, description: 'Amount in pence/cents' })
  @IsInt()
  @Min(0)
  amount!: number;
}

export class CreateExpenseDto {
  @ApiProperty({ example: 'Friday dinner', maxLength: 200 })
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  @IsNotEmpty({ message: 'title must not be empty' })
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 1250, description: 'Total amount in pence/cents' })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'GBP', enum: ['GBP', 'EUR', 'USD'] })
  @IsIn(['GBP', 'EUR', 'USD'])
  currency!: string;

  @ApiProperty({ example: '2026-03-01T12:00:00.000Z' })
  @IsISO8601()
  date!: string;

  @ApiProperty({ example: 'clxyz123', description: 'User ID of who paid' })
  @IsString()
  @IsNotEmpty()
  paidBy!: string;

  @ApiProperty({ type: [ExpenseShareDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseShareDto)
  shares!: ExpenseShareDto[];
}
