import { ApiProperty } from '@nestjs/swagger';

export class InvitationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  senderId!: string;

  @ApiProperty()
  receiverId!: string;

  @ApiProperty()
  splitId!: string;

  @ApiProperty()
  createdAt!: Date;
}
