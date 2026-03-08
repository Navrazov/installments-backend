import { Model } from 'mongoose';
import { AuditLogDocument } from './schemas/audit-log.schema';
export interface AuditLogParams {
    orgId?: string;
    userId: string;
    userEmail: string;
    action: string;
    entity: string;
    entityId?: string;
    changes?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}
export interface QueryAuditDto {
    page?: number;
    limit?: number;
    userId?: string;
    entity?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
}
export declare class AuditService {
    private readonly auditLogModel;
    private readonly logger;
    constructor(auditLogModel: Model<AuditLogDocument>);
    log(params: AuditLogParams): Promise<AuditLogDocument>;
    findAll(orgId: string, query: QueryAuditDto): Promise<{
        data: AuditLogDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    findByEntity(orgId: string, entity: string, entityId: string): Promise<AuditLogDocument[]>;
    getRecentActivity(orgId: string, limit?: number): Promise<AuditLogDocument[]>;
}
