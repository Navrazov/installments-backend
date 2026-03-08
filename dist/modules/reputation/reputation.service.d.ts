import { Model } from 'mongoose';
import { WarningDocument } from './schemas/warning.schema';
import { ClientDocument, RiskStatus } from '../clients/schemas/client.schema';
import { CreateWarningDto } from './dto/create-warning.dto';
export declare class ReputationService {
    private readonly warningModel;
    private readonly clientModel;
    private readonly logger;
    constructor(warningModel: Model<WarningDocument>, clientModel: Model<ClientDocument>);
    addWarning(orgId: string, dto: CreateWarningDto, userId: string): Promise<WarningDocument>;
    findWarnings(orgId: string, clientId: string): Promise<WarningDocument[]>;
    findAllWarnings(orgId: string, query: {
        page?: number;
        limit?: number;
        type?: string;
        severity?: string;
        isActive?: boolean;
        clientId?: string;
    }): Promise<{
        data: WarningDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    deactivateWarning(orgId: string, warningId: string, userId: string): Promise<WarningDocument>;
    getClientReputationSummary(orgId: string, clientId: string): Promise<{
        warningsCount: number;
        activeWarnings: number;
        riskStatus: RiskStatus;
        isBlacklisted: boolean;
    }>;
    calculateRiskStatus(clientId: string): Promise<RiskStatus>;
}
