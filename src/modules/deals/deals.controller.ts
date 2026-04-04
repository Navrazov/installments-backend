import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDealDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.dealsService.create(orgId, dto, userId);
  }

  @Get('stats')
  async getStats(@Req() req: AuthenticatedRequest) {
    const orgId = req.user.organizationId!;
    return this.dealsService.getStats(orgId);
  }

  @Get('upcoming-payments')
  async getUpcomingPayments(
    @Req() req: AuthenticatedRequest,
    @Query('days') days?: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.dealsService.getUpcomingPayments(orgId, Number(days) || 7);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryDealDto,
  ) {
    const orgId = req.user.organizationId!;
    return this.dealsService.findAll(orgId, query);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.dealsService.findById(orgId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.dealsService.update(orgId, id, dto, userId);
  }

  @Post(':id/cancel')
  async cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.dealsService.cancel(orgId, id, userId);
  }

  @Post(':id/close')
  async close(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.dealsService.close(orgId, id, userId);
  }
}
