import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;
}
