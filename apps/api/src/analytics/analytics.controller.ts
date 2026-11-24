import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.analyticsService.getDashboard(userId);
  }

  @Get('spending')
  @ApiOperation({ summary: 'Get monthly spending trends and category breakdown' })
  async getSpending(
    @CurrentUser('id') userId: string,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getSpending(userId, months ? parseInt(months, 10) : 6);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get spending trends (alias)' })
  async getTrend(
    @CurrentUser('id') userId: string,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getSpending(userId, months ? parseInt(months, 10) : 6);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get category breakdown (alias)' })
  async getCategories(
    @CurrentUser('id') userId: string,
    @Query('months') months?: string,
  ) {
    return this.analyticsService.getSpending(userId, months ? parseInt(months, 10) : 6);
  }
}
