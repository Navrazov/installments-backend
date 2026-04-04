import { OverdueStatus } from '../schemas/overdue.schema';
export declare class QueryOverdueDto {
    page?: number;
    limit?: number;
    status?: OverdueStatus;
    assignedTo?: string;
    minDays?: number;
    maxDays?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
