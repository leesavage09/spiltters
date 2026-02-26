import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSplitDto } from './dto/create-split.dto';
import { SplitResponseDto } from './dto/split-response.dto';
import { SplitsService } from './splits.service';

//TODO requests are not typed, need to fix that

@ApiTags('splits')
@Controller('splits')
@UseGuards(JwtAuthGuard)
export class SplitsController {
  constructor(private readonly splitsService: SplitsService) {}

  @Get()
  @ApiOperation({ summary: 'List current user splits' })
  @ApiResponse({ status: 200, type: [SplitResponseDto] })
  async findAll(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<SplitResponseDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id as string;
    return this.splitsService.findAllByUser(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new split' })
  @ApiBody({ type: CreateSplitDto })
  @ApiResponse({ status: 201, type: SplitResponseDto })
  async create(
    @Body() dto: CreateSplitDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ): Promise<SplitResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = req.user.id as string;
    return this.splitsService.create(userId, dto.name, dto.emoji);
  }
}
