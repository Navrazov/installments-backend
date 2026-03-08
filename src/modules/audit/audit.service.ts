import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

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

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(params: AuditLogParams): Promise<AuditLogDocument> {
    try {
      const auditLog = new this.auditLogModel({
        organizationId: params.orgId
          ? new Types.ObjectId(params.orgId)
          : undefined,
        userId: new Types.ObjectId(params.userId),
        userEmail: params.userEmail,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId
          ? new Types.ObjectId(params.entityId)
          : undefined,
        changes: params.changes
          ? { before: params.changes.before ?? null, after: params.changes.after ?? null }
          : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        createdAt: new Date(),
      });

      return await auditLog.save();
    } catch (error) {
      // Audit logging should never break the main flow.
      // Log the error but do not rethrow.
      this.logger.error(
        `Failed to write audit log: ${error.message}`,
        error.stack,
      );
      return null as unknown as AuditLogDocument;
    }
  }

  async findAll(
    orgId: string,
    query: QueryAuditDto,
  ): Promise<{ data: AuditLogDocument[]; total: number; page: number; limit: number }> {
    const filter: FilterQuery<AuditLogDocument> = {
      organizationId: new Types.ObjectId(orgId),
    };

    if (query.userId && Types.ObjectId.isValid(query.userId)) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.entity) {
      filter.entity = query.entity;
    }

    if (query.action) {
      filter.action = query.action;
    }

    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) {
        filter.createdAt.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        filter.createdAt.$lte = new Date(query.dateTo);
      }
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findByEntity(
    orgId: string,
    entity: string,
    entityId: string,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({
        organizationId: new Types.ObjectId(orgId),
        entity,
        entityId: new Types.ObjectId(entityId),
      })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getRecentActivity(
    orgId: string,
    limit: number = 20,
  ): Promise<AuditLogDocument[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    return this.auditLogModel
      .find({ organizationId: new Types.ObjectId(orgId) })
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .exec();
  }
}
