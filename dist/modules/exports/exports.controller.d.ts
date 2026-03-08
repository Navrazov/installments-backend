import { Response } from 'express';
import { ExportsService } from './exports.service';
import { ReportQueryDto } from '../reports/dto/report-query.dto';
export declare class ExportsController {
    private readonly exportsService;
    constructor(exportsService: ExportsService);
    exportClientsPdf(req: any, res: Response, query: ReportQueryDto): Promise<void>;
    exportClientsExcel(req: any, res: Response, query: ReportQueryDto): Promise<void>;
    exportDealsPdf(req: any, res: Response, query: ReportQueryDto): Promise<void>;
    exportDealsExcel(req: any, res: Response, query: ReportQueryDto): Promise<void>;
    exportPaymentsPdf(req: any, res: Response, query: ReportQueryDto): Promise<void>;
    exportPaymentsExcel(req: any, res: Response, query: ReportQueryDto): Promise<void>;
    exportReportPdf(req: any, res: Response, type: string, query: ReportQueryDto & {
        monthsBack?: number;
    }): Promise<void>;
    exportReportExcel(req: any, res: Response, type: string, query: ReportQueryDto & {
        monthsBack?: number;
    }): Promise<void>;
    private sendPdf;
    private sendExcel;
}
