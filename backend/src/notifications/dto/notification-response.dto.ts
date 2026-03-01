import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  entityId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  readAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
