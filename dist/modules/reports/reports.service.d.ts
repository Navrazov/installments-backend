import { Model } from 'mongoose';
import { DealDocument } from '../deals/schemas/deal.schema';
import { PaymentDocument } from '../payments/schemas/payment.schema';
import { ClientDocument } from '../clients/schemas/client.schema';
import { OverdueDocument } from '../overdue/schemas/overdue.schema';
export declare class ReportsService {
    private readonly dealModel;
    private readonly paymentModel;
    private readonly clientModel;
    private readonly overdueModel;
    constructor(dealModel: Model<DealDocument>, paymentModel: Model<PaymentDocument>, clientModel: Model<ClientDocument>, overdueModel: Model<OverdueDocument>);
    getDashboardSummary(orgId: string): Promise<{
        totalDeals: any;
        activeDeals: any;
        closedDeals: any;
        overdueDeals: any;
        totalVolume: any;
        totalCollected: any;
        totalReceivable: any;
        overdueReceivable: any;
        newClientsThisMonth: number;
        averageOverdueDays: number;
    }>;
    getDealsReport(orgId: string, dateFrom?: string, dateTo?: string): Promise<{
        totalDeals: any;
        totalVolume: any;
        byStatus: any[];
        volumeOverTime: any[];
    }>;
    getPaymentsReport(orgId: string, dateFrom?: string, dateTo?: string): Promise<{
        totalPayments: any;
        totalCollected: any;
        earlyPayments: any;
        collectionRate: number;
        byMonth: any[];
        byMethod: any[];
    }>;
    getOverdueReport(orgId: string): Promise<{
        totalOverdueAmount: any;
        averageOverdueDays: number;
        totalOverdueRecords: any;
        maxOverdueDays: any;
        byStatus: any[];
        topOverdueClients: any[];
    }>;
    getClientsReport(orgId: string): Promise<{
        totalClients: number;
        byRiskStatus: any[];
        newClientsTrend: any[];
        topClientsByVolume: any[];
    }>;
    getManagerPerformance(orgId: string, dateFrom?: string, dateTo?: string): Promise<{
        managers: any[];
    }>;
    getBranchPerformance(orgId: string, dateFrom?: string, dateTo?: string): Promise<{
        branches: any[];
    }>;
    getMonthlyDynamics(orgId: string, monthsBack?: number): Promise<{
        months: any[];
    }>;
    getDownPaymentAnalysis(orgId: string): Promise<{
        avgDownPaymentPercent: number;
        avgDownPaymentAmount: number;
        minDownPayment: any;
        maxDownPayment: any;
        distribution: any[];
    }>;
    getTermDistribution(orgId: string): Promise<{
        avgTermMonths: number;
        minTermMonths: any;
        maxTermMonths: any;
        distribution: any[];
    }>;
    getCollectionEfficiency(orgId: string, dateFrom?: string, dateTo?: string): Promise<{
        totalExpected: any;
        totalActual: any;
        overallEfficiency: number;
        monthly: any[];
    }>;
}
