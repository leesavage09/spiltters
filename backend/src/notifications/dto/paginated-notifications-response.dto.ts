import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { NotificationResponseDto } from './notification-response.dto';

export class PaginatedNotificationsResponseDto extends PaginatedResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items!: NotificationResponseDto[];
}
