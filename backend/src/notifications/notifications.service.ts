import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserSafeException } from 'src/common/errors/useSafeError';
import type { NotificationResponseDto } from './dto/notification-response.dto';
import type { PaginatedNotificationsResponseDto } from './dto/paginated-notifications-response.dto';
import type { UnreadCountResponseDto } from './dto/unread-count-response.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<PaginatedNotificationsResponseDto> {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      items: notifications.map((n) => this.toResponseDto(n)),
      total,
      hasMore: skip + take < total,
    };
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponseDto> {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    return { count };
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId)
      throw new UserSafeException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return this.toResponseDto(updated);
  }

  private toResponseDto(notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    entityId: string;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      entityId: notification.entityId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
