import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SplitUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  username?: string | null;
}
