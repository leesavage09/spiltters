import { ApiProperty } from '@nestjs/swagger';
import { SplitUserResponseDto } from './split-user-response.dto';

export class SplitResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  emoji!: string;

  @ApiProperty({ type: [SplitUserResponseDto] })
  users!: SplitUserResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
