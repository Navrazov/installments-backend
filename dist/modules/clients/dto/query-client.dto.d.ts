import { RiskStatus } from '../schemas/client.schema';
export declare class QueryClientDto {
    page?: number;
    limit?: number;
    search?: string;
    riskStatus?: RiskStatus;
    tags?: string[];
    isBlacklisted?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isGuarantor?: boolean;
}
