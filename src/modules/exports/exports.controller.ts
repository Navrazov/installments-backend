import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportQueryDto } from '../reports/dto/report-query.dto';

@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  // ---------------------------------------------------------------------------
  // Clients
  // ---------------------------------------------------------------------------

  @Get('clients/pdf')
  async exportClientsPdf(
    @Request() req: any,
    @Res() res: Response,
    @Query() query: ReportQueryDto,
  ) {
    const buffer = await this.exportsService.exportClientsToPdf(
      req.user.organizationId.toString(),
      query,
    );
    this.sendPdf(res, buffer, 'clients');
  }

  @Get('clients/excel')
  async exportClientsExcel(
    @Request() req: any,
    @Res() res: Response,
    @Query() query: ReportQueryDto,
  ) {
    const buffer = await this.exportsService.exportClientsToExcel(
      req.user.organizationId.toString(),
      query,
    );
    this.sendExcel(res, buffer, 'clients');
  }

  // ---------------------------------------------------------------------------
  // Deals
  // ---------------------------------------------------------------------------

  @Get('deals/pdf')
  async exportDealsPdf(
    @Request() req: any,
    @Res() res: Response,
    @Query() query: ReportQueryDto,
  ) {
    const buffer = await this.exportsService.exportDealsToPdf(
      req.user.organizationId.toString(),
      query,
    );
    this.sendPdf(res, buffer, 'deals');
  }

  @Get('deals/excel')
  async exportDealsExcel(
    @Request() req: any,
    @Res() res: Response,
    @Query() query: ReportQueryDto,
  ) {
    const buffer = await this.exportsService.exportDealsToExcel(
      req.user.organizationId.toString(),
      query,
    );
    this.sendExcel(res, buffer, 'deals');
  }

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  @Get('payments/pdf')
  async exportPaymentsPdf(
    @Request() req: any,
    @Res() res: Response,
    @Query() query: ReportQueryDto,
  ) {
    const buffer = await this.exportsService.exportPaymentsToPdf(
      req.user.organizationId.toString(),
      query,
    );
    this.sendPdf(res, buffer, 'payments');
  }

  @Get('payments/excel')
  async exportPaymentsExcel(
    @Request() req: any,
    @Res() res: Response,
    @Query() query: ReportQueryDto,
  ) {
    const buffer = await this.exportsService.exportPaymentsToExcel(
      req.user.organizationId.toString(),
      query,
    );
    this.sendExcel(res, buffer, 'payments');
  }

  // ---------------------------------------------------------------------------
  // Reports
  // ---------------------------------------------------------------------------

  @Get('reports/:type/pdf')
  async exportReportPdf(
    @Request() req: any,
    @Res() res: Response,
    @Param('type') type: string,
    @Query() query: ReportQueryDto & { monthsBack?: number },
  ) {
    const buffer = await this.exportsService.exportReportToPdf(
      req.user.organizationId.toString(),
      type,
      {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        monthsBack: query.monthsBack ? Number(query.monthsBack) : undefined,
      },
    );
    this.sendPdf(res, buffer, `report-${type}`);
  }

  @Get('reports/:type/excel')
  async exportReportExcel(
    @Request() req: any,
    @Res() res: Response,
    @Param('type') type: string,
    @Query() query: ReportQueryDto & { monthsBack?: number },
  ) {
    const buffer = await this.exportsService.exportReportToExcel(
      req.user.organizationId.toString(),
      type,
      {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        monthsBack: query.monthsBack ? Number(query.monthsBack) : undefined,
      },
    );
    this.sendExcel(res, buffer, `report-${type}`);
  }

  // ---------------------------------------------------------------------------
  // Response helpers
  // ---------------------------------------------------------------------------

  private sendPdf(res: Response, buffer: Buffer, filename: string): void {
    const timestamp = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}_${timestamp}.pdf"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });
    res.end(buffer);
  }

  private sendExcel(res: Response, buffer: Buffer, filename: string): void {
    const timestamp = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}_${timestamp}.xlsx"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache',
    });
    res.end(buffer);
  }
}
