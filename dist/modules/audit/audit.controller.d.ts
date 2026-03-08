import { AuditService } from './audit.service';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(req: AuthenticatedRequest, page?: string, limit?: string, userId?: string, entity?: string, action?: string, dateFrom?: string, dateTo?: string): Promise<{
        data: import("./schemas/audit-log.schema").AuditLogDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    getRecentActivity(req: AuthenticatedRequest, limit?: string): Promise<import("./schemas/audit-log.schema").AuditLogDocument[]>;
    findByEntity(req: AuthenticatedRequest, entity: string, entityId: string): Promise<import("./schemas/audit-log.schema").AuditLogDocument[]>;
}
