import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { Types } from 'mongoose';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('by-deal/:dealId')
  async findByDeal(
    @Req() req: AuthenticatedRequest,
    @Param('dealId') dealId: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.contractsService.findByDeal(orgId, dealId);
  }

  @Post('from-deal/:dealId')
  async createFromDeal(
    @Req() req: AuthenticatedRequest,
    @Param('dealId') dealId: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.contractsService.createFromDeal(
      orgId,
      new Types.ObjectId(dealId),
    );
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.contractsService.findById(orgId, id);
  }

  @Post(':id/regenerate')
  async regenerate(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.contractsService.regenerate(orgId, id);
  }

  @Get(':id/html')
  async renderHtml(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const orgId = req.user.organizationId!;
    const contract = await this.contractsService.findById(orgId, id);
    if (!contract) throw new NotFoundException('Contract not found');
    const html = this.contractsService.renderHtml(contract);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
