import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OverdueService } from './overdue.service';
import { UpdateOverdueDto } from './dto/update-overdue.dto';
import { QueryOverdueDto } from './dto/query-overdue.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@UseGuards(JwtAuthGuard)
@Controller('overdue')
export class OverdueController {
  constructor(private readonly overdueService: OverdueService) {}

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query() query: QueryOverdueDto,
  ) {
    const orgId = req.user.organizationId!.toString();
    return this.overdueService.findAll(orgId, query);
  }

  @Get('stats')
  async getStats(@Request() req: AuthenticatedRequest) {
    const orgId = req.user.organizationId!.toString();
    return this.overdueService.getStats(orgId);
  }

  @Get(':id')
  async findById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    return this.overdueService.findById(orgId, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateOverdueDto,
  ) {
    const orgId = req.user.organizationId!.toString();
    const userId = req.user._id.toString();
    return this.overdueService.updateStatus(orgId, id, dto, userId);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolve(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    const userId = req.user._id.toString();
    return this.overdueService.resolve(orgId, id, userId);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncFromDeals(@Request() req: AuthenticatedRequest) {
    const orgId = req.user.organizationId!.toString();
    return this.overdueService.syncOverdueFromDeals(orgId);
  }
}
