import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateSplitDto {
  @ApiProperty({ example: 'Friday Dinner', maxLength: 50 })
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  @IsNotEmpty({ message: 'name must not be empty' })
  @MaxLength(50)
  name!: string;

  @ApiProperty({ example: '🍕' })
  @IsString()
  @Matches(/^\p{Emoji_Presentation}$/u, {
    message: 'emoji must be exactly one emoji character',
  })
  emoji!: string;
}
