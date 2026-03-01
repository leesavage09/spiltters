import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationResponseDto } from './dto/invitation-response.dto';
import { AcceptInvitationResponseDto } from './dto/accept-invitation-response.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an invitation to a split' })
  @ApiBody({ type: CreateInvitationDto })
  @ApiResponse({ status: 201, type: InvitationResponseDto })
  async create(
    @Body() dto: CreateInvitationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<InvitationResponseDto> {
    return this.invitationsService.create(req.user.id, dto);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept an invitation and join the split' })
  @ApiResponse({ status: 200, type: AcceptInvitationResponseDto })
  async accept(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AcceptInvitationResponseDto> {
    return this.invitationsService.accept(req.user.id, id);
  }
}
