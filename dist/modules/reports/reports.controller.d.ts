import { ReportsService } from './reports.service';
import { ReportQueryDto, DynamicsQueryDto } from './dto/report-query.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getDashboard(req: any): Promise<{
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
    getDealsReport(req: any, query: ReportQueryDto): Promise<{
        totalDeals: any;
        totalVolume: any;
        byStatus: any[];
        volumeOverTime: any[];
    }>;
    getPaymentsReport(req: any, query: ReportQueryDto): Promise<{
        totalPayments: any;
        totalCollected: any;
        earlyPayments: any;
        collectionRate: number;
        byMonth: any[];
        byMethod: any[];
    }>;
    getOverdueReport(req: any): Promise<{
        totalOverdueAmount: any;
        averageOverdueDays: number;
        totalOverdueRecords: any;
        maxOverdueDays: any;
        byStatus: any[];
        topOverdueClients: any[];
    }>;
    getClientsReport(req: any): Promise<{
        totalClients: number;
        byRiskStatus: any[];
        newClientsTrend: any[];
        topClientsByVolume: any[];
    }>;
    getManagerPerformance(req: any, query: ReportQueryDto): Promise<{
        managers: any[];
    }>;
    getBranchPerformance(req: any, query: ReportQueryDto): Promise<{
        branches: any[];
    }>;
    getMonthlyDynamics(req: any, query: DynamicsQueryDto): Promise<{
        months: any[];
    }>;
    getDownPaymentAnalysis(req: any): Promise<{
        avgDownPaymentPercent: number;
        avgDownPaymentAmount: number;
        minDownPayment: any;
        maxDownPayment: any;
        distribution: any[];
    }>;
    getTermDistribution(req: any): Promise<{
        avgTermMonths: number;
        minTermMonths: any;
        maxTermMonths: any;
        distribution: any[];
    }>;
    getCollectionEfficiency(req: any, query: ReportQueryDto): Promise<{
        totalExpected: any;
        totalActual: any;
        overallEfficiency: number;
        monthly: any[];
    }>;
}
