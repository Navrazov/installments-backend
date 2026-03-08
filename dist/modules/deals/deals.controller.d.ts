import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class DealsController {
    private readonly dealsService;
    constructor(dealsService: DealsService);
    create(req: AuthenticatedRequest, dto: CreateDealDto): Promise<import("./schemas/deal.schema").DealDocument>;
    getStats(req: AuthenticatedRequest): Promise<{
        totalDeals: number;
        active: number;
        closed: number;
        overdue: number;
        cancelled: number;
        totalVolume: number;
        totalCollected: number;
        totalRemaining: number;
    }>;
    findAll(req: AuthenticatedRequest, query: QueryDealDto): Promise<{
        data: import("./schemas/deal.schema").DealDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(req: AuthenticatedRequest, id: string): Promise<import("./schemas/deal.schema").DealDocument>;
    update(req: AuthenticatedRequest, id: string, dto: UpdateDealDto): Promise<import("./schemas/deal.schema").DealDocument>;
    cancel(req: AuthenticatedRequest, id: string): Promise<import("./schemas/deal.schema").DealDocument>;
    close(req: AuthenticatedRequest, id: string): Promise<import("./schemas/deal.schema").DealDocument>;
}
