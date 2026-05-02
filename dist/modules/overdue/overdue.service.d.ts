import { Model } from 'mongoose';
import { OverdueDocument } from './schemas/overdue.schema';
import { DealDocument } from '../deals/schemas/deal.schema';
import { UpdateOverdueDto } from './dto/update-overdue.dto';
import { QueryOverdueDto } from './dto/query-overdue.dto';
export declare class OverdueService {
    private readonly overdueModel;
    private readonly dealModel;
    private readonly logger;
    constructor(overdueModel: Model<OverdueDocument>, dealModel: Model<DealDocument>);
    findAll(orgId: string, query: QueryOverdueDto): Promise<{
        data: OverdueDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(orgId: string, overdueId: string): Promise<OverdueDocument>;
    createOrUpdate(orgId: string, dealId: string, clientId: string, overdueAmount: number, overdueDays: number): Promise<OverdueDocument>;
    updateStatus(orgId: string, overdueId: string, dto: UpdateOverdueDto, userId: string): Promise<OverdueDocument>;
    resolve(orgId: string, overdueId: string, userId: string): Promise<OverdueDocument>;
    getStats(orgId: string): Promise<{
        totalOverdue: number;
        totalOverdueAmount: number;
        averageOverdueDays: number;
        byStatus: Record<string, number>;
        newThisWeek: number;
        resolvedThisWeek: number;
    }>;
    syncOverdueFromDeals(orgId: string): Promise<{
        created: number;
        updated: number;
    }>;
}
