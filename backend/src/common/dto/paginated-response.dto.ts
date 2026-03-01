import { ApiProperty } from '@nestjs/swagger';

export abstract class PaginatedResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  hasMore!: boolean;
}
