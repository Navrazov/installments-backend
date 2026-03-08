"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
let AuditService = AuditService_1 = class AuditService {
    constructor(auditLogModel) {
        this.auditLogModel = auditLogModel;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async log(params) {
        try {
            const auditLog = new this.auditLogModel({
                organizationId: params.orgId
                    ? new mongoose_2.Types.ObjectId(params.orgId)
                    : undefined,
                userId: new mongoose_2.Types.ObjectId(params.userId),
                userEmail: params.userEmail,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId
                    ? new mongoose_2.Types.ObjectId(params.entityId)
                    : undefined,
                changes: params.changes
                    ? { before: params.changes.before ?? null, after: params.changes.after ?? null }
                    : null,
                ipAddress: params.ipAddress || null,
                userAgent: params.userAgent || null,
                createdAt: new Date(),
            });
            return await auditLog.save();
        }
        catch (error) {
            this.logger.error(`Failed to write audit log: ${error.message}`, error.stack);
            return null;
        }
    }
    async findAll(orgId, query) {
        const filter = {
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        };
        if (query.userId && mongoose_2.Types.ObjectId.isValid(query.userId)) {
            filter.userId = new mongoose_2.Types.ObjectId(query.userId);
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
    async findByEntity(orgId, entity, entityId) {
        return this.auditLogModel
            .find({
            organizationId: new mongoose_2.Types.ObjectId(orgId),
            entity,
            entityId: new mongoose_2.Types.ObjectId(entityId),
        })
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .exec();
    }
    async getRecentActivity(orgId, limit = 20) {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        return this.auditLogModel
            .find({ organizationId: new mongoose_2.Types.ObjectId(orgId) })
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(safeLimit)
            .exec();
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuditService);
//# sourceMappingURL=audit.service.js.map