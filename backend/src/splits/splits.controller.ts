import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateSplitDto } from './dto/create-split.dto';
import { SplitResponseDto } from './dto/split-response.dto';
import { SplitsService } from './splits.service';

@ApiTags('splits')
@Controller('splits')
@UseGuards(JwtAuthGuard)
export class SplitsController {
  constructor(private readonly splitsService: SplitsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user splits' })
  @ApiResponse({ status: 200, type: [SplitResponseDto] })
  async findAll(@Req() req: AuthenticatedRequest): Promise<SplitResponseDto[]> {
    return this.splitsService.findAllByUser(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new split' })
  @ApiBody({ type: CreateSplitDto })
  @ApiResponse({ status: 201, type: SplitResponseDto })
  async create(
    @Body() dto: CreateSplitDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SplitResponseDto> {
    return this.splitsService.create(req.user.id, dto.name, dto.emoji);
  }
}
