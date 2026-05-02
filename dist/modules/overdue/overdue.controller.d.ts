import { OverdueService } from './overdue.service';
import { UpdateOverdueDto } from './dto/update-overdue.dto';
import { QueryOverdueDto } from './dto/query-overdue.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class OverdueController {
    private readonly overdueService;
    constructor(overdueService: OverdueService);
    findAll(req: AuthenticatedRequest, query: QueryOverdueDto): Promise<{
        data: import("./schemas/overdue.schema").OverdueDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    getStats(req: AuthenticatedRequest): Promise<{
        totalOverdue: number;
        totalOverdueAmount: number;
        averageOverdueDays: number;
        byStatus: Record<string, number>;
        newThisWeek: number;
        resolvedThisWeek: number;
    }>;
    findById(req: AuthenticatedRequest, id: string): Promise<import("./schemas/overdue.schema").OverdueDocument>;
    updateStatus(req: AuthenticatedRequest, id: string, dto: UpdateOverdueDto): Promise<import("./schemas/overdue.schema").OverdueDocument>;
    resolve(req: AuthenticatedRequest, id: string): Promise<import("./schemas/overdue.schema").OverdueDocument>;
    syncFromDeals(req: AuthenticatedRequest): Promise<{
        created: number;
        updated: number;
    }>;
}
