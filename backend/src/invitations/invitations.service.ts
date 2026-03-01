import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserSafeException } from 'src/common/errors/useSafeError';
import type { CreateInvitationDto } from './dto/create-invitation.dto';
import type { InvitationResponseDto } from './dto/invitation-response.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    senderId: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    const receiver = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!receiver) throw new UserSafeException('User not found');

    if (receiver.id === senderId)
      throw new UserSafeException('You cannot invite yourself');

    const split = await this.prisma.split.findUnique({
      where: { id: dto.splitId },
      include: { users: true },
    });

    if (!split || !split.users.some((u) => u.userId === senderId))
      throw new UserSafeException('Split not found');

    if (split.users.some((u) => u.userId === receiver.id))
      throw new UserSafeException('User is already a member of this split');

    const existingInvitation = await this.prisma.invitation.findUnique({
      where: {
        receiverId_splitId: {
          receiverId: receiver.id,
          splitId: dto.splitId,
        },
      },
    });

    if (existingInvitation)
      throw new UserSafeException(
        'User has already been invited to this split',
      );

    const invitation = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.create({
        data: {
          senderId,
          receiverId: receiver.id,
          splitId: dto.splitId,
        },
      });

      await tx.notification.create({
        data: {
          userId: receiver.id,
          title: 'Invitation',
          message: `You have been invited to join the split ${split.name}`,
          type: 'INVITATION',
          entityId: inv.id,
        },
      });

      return inv;
    });

    return {
      id: invitation.id,
      senderId: invitation.senderId,
      receiverId: invitation.receiverId,
      splitId: invitation.splitId,
      createdAt: invitation.createdAt,
    };
  }
}
