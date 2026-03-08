import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.paymentsService.create(orgId, dto, userId);
  }

  @Get('stats')
  async getStats(
    @Req() req: AuthenticatedRequest,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.paymentsService.getStats(orgId, dateFrom, dateTo);
  }

  @Get('by-deal/:dealId')
  async getPaymentsByDeal(
    @Req() req: AuthenticatedRequest,
    @Param('dealId') dealId: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.paymentsService.getPaymentsByDeal(orgId, dealId);
  }

  @Post('early-repayment')
  async earlyRepayment(
    @Req() req: AuthenticatedRequest,
    @Body() body: { dealId: string; amount: number },
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.paymentsService.earlyRepayment(
      orgId,
      body.dealId,
      body.amount,
      userId,
    );
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryPaymentDto,
  ) {
    const orgId = req.user.organizationId!;
    return this.paymentsService.findAll(orgId, query);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.paymentsService.findById(orgId, id);
  }
}
