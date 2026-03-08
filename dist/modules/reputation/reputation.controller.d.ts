import { ReputationService } from './reputation.service';
import { CreateWarningDto } from './dto/create-warning.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class ReputationController {
    private readonly reputationService;
    constructor(reputationService: ReputationService);
    addWarning(req: AuthenticatedRequest, dto: CreateWarningDto): Promise<import("./schemas/warning.schema").WarningDocument>;
    findClientWarnings(req: AuthenticatedRequest, clientId: string): Promise<import("./schemas/warning.schema").WarningDocument[]>;
    findAllWarnings(req: AuthenticatedRequest, page?: string, limit?: string, type?: string, severity?: string, isActive?: string, clientId?: string): Promise<{
        data: import("./schemas/warning.schema").WarningDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    deactivateWarning(req: AuthenticatedRequest, id: string): Promise<import("./schemas/warning.schema").WarningDocument>;
    getClientReputationSummary(req: AuthenticatedRequest, clientId: string): Promise<{
        warningsCount: number;
        activeWarnings: number;
        riskStatus: import("../clients/schemas/client.schema").RiskStatus;
        isBlacklisted: boolean;
    }>;
}
