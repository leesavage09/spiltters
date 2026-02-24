import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: string;
}

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
