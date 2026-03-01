import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationResponseDto {
  @ApiProperty()
  splitId!: string;
}
