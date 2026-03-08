import { DealStatus } from '../schemas/deal.schema';
export declare class QueryDealDto {
    page?: number;
    limit?: number;
    status?: DealStatus;
    clientId?: string;
    managerId?: string;
    branchName?: string;
    startDateFrom?: string;
    startDateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
