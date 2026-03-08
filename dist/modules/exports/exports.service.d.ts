import { Model } from 'mongoose';
import { DealDocument } from '../deals/schemas/deal.schema';
import { PaymentDocument } from '../payments/schemas/payment.schema';
import { ClientDocument } from '../clients/schemas/client.schema';
import { ReportsService } from '../reports/reports.service';
interface ExportFilters {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    search?: string;
}
export declare class ExportsService {
    private readonly dealModel;
    private readonly paymentModel;
    private readonly clientModel;
    private readonly reportsService;
    constructor(dealModel: Model<DealDocument>, paymentModel: Model<PaymentDocument>, clientModel: Model<ClientDocument>, reportsService: ReportsService);
    exportClientsToPdf(orgId: string, filters: ExportFilters): Promise<Buffer>;
    exportClientsToExcel(orgId: string, filters: ExportFilters): Promise<Buffer>;
    exportDealsToPdf(orgId: string, filters: ExportFilters): Promise<Buffer>;
    exportDealsToExcel(orgId: string, filters: ExportFilters): Promise<Buffer>;
    exportPaymentsToPdf(orgId: string, filters: ExportFilters): Promise<Buffer>;
    exportPaymentsToExcel(orgId: string, filters: ExportFilters): Promise<Buffer>;
    exportReportToPdf(orgId: string, reportType: string, params: {
        dateFrom?: string;
        dateTo?: string;
        monthsBack?: number;
    }): Promise<Buffer>;
    exportReportToExcel(orgId: string, reportType: string, params: {
        dateFrom?: string;
        dateTo?: string;
        monthsBack?: number;
    }): Promise<Buffer>;
    private getClients;
    private getDeals;
    private getPayments;
    private getReportData;
    private formatReportForTable;
    private generatePdfTable;
    private addExcelHeader;
    private styleExcelHeaderRow;
    private autoFitColumns;
    private formatCurrency;
    private formatDate;
    private truncate;
}
export {};
