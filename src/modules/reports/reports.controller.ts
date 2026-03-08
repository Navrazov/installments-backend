import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportQueryDto, DynamicsQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return this.reportsService.getDashboardSummary(
      req.user.organizationId.toString(),
    );
  }

  @Get('deals')
  async getDealsReport(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getDealsReport(
      req.user.organizationId.toString(),
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('payments')
  async getPaymentsReport(@Request() req: any, @Query() query: ReportQueryDto) {
    return this.reportsService.getPaymentsReport(
      req.user.organizationId.toString(),
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('overdue')
  async getOverdueReport(@Request() req: any) {
    return this.reportsService.getOverdueReport(
      req.user.organizationId.toString(),
    );
  }

  @Get('clients')
  async getClientsReport(@Request() req: any) {
    return this.reportsService.getClientsReport(
      req.user.organizationId.toString(),
    );
  }

  @Get('managers')
  async getManagerPerformance(
    @Request() req: any,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getManagerPerformance(
      req.user.organizationId.toString(),
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('branches')
  async getBranchPerformance(
    @Request() req: any,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getBranchPerformance(
      req.user.organizationId.toString(),
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('dynamics')
  async getMonthlyDynamics(
    @Request() req: any,
    @Query() query: DynamicsQueryDto,
  ) {
    return this.reportsService.getMonthlyDynamics(
      req.user.organizationId.toString(),
      query.monthsBack,
    );
  }

  @Get('down-payments')
  async getDownPaymentAnalysis(@Request() req: any) {
    return this.reportsService.getDownPaymentAnalysis(
      req.user.organizationId.toString(),
    );
  }

  @Get('terms')
  async getTermDistribution(@Request() req: any) {
    return this.reportsService.getTermDistribution(
      req.user.organizationId.toString(),
    );
  }

  @Get('collection-efficiency')
  async getCollectionEfficiency(
    @Request() req: any,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getCollectionEfficiency(
      req.user.organizationId.toString(),
      query.dateFrom,
      query.dateTo,
    );
  }
}
