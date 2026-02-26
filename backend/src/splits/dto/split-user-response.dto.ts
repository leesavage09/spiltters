import { ApiProperty } from '@nestjs/swagger';

export class SplitUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;
}
