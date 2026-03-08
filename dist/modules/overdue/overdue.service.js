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
var OverdueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverdueService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const overdue_schema_1 = require("./schemas/overdue.schema");
const deal_schema_1 = require("../deals/schemas/deal.schema");
let OverdueService = OverdueService_1 = class OverdueService {
    constructor(overdueModel, dealModel) {
        this.overdueModel = overdueModel;
        this.dealModel = dealModel;
        this.logger = new common_1.Logger(OverdueService_1.name);
    }
    async findAll(orgId, query) {
        const filter = {
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        };
        if (query.status) {
            filter.status = query.status;
        }
        if (query.assignedTo) {
            filter.assignedTo = new mongoose_2.Types.ObjectId(query.assignedTo);
        }
        if (query.minDays !== undefined || query.maxDays !== undefined) {
            filter.overdueDays = {};
            if (query.minDays !== undefined) {
                filter.overdueDays.$gte = query.minDays;
            }
            if (query.maxDays !== undefined) {
                filter.overdueDays.$lte = query.maxDays;
            }
        }
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.overdueModel
                .find(filter)
                .populate('clientId', 'firstName lastName phone')
                .populate('dealId', 'dealNumber totalAmount remainingAmount')
                .populate('assignedTo', 'firstName lastName email')
                .sort({ overdueDays: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.overdueModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async findById(orgId, overdueId) {
        if (!mongoose_2.Types.ObjectId.isValid(overdueId)) {
            throw new common_1.BadRequestException('Invalid overdue ID');
        }
        const overdue = await this.overdueModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(overdueId),
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        })
            .populate('clientId', 'firstName lastName phone riskStatus')
            .populate('dealId', 'dealNumber totalAmount remainingAmount status paymentSchedule')
            .populate('assignedTo', 'firstName lastName email')
            .exec();
        if (!overdue) {
            throw new common_1.NotFoundException(`Overdue record with ID "${overdueId}" not found`);
        }
        return overdue;
    }
    async createOrUpdate(orgId, dealId, clientId, overdueAmount, overdueDays) {
        const orgOid = new mongoose_2.Types.ObjectId(orgId);
        const dealOid = new mongoose_2.Types.ObjectId(dealId);
        const clientOid = new mongoose_2.Types.ObjectId(clientId);
        const existing = await this.overdueModel
            .findOne({
            organizationId: orgOid,
            dealId: dealOid,
            status: { $ne: overdue_schema_1.OverdueStatus.RESOLVED },
        })
            .exec();
        if (existing) {
            existing.overdueAmount = overdueAmount;
            existing.overdueDays = overdueDays;
            return existing.save();
        }
        const overdue = new this.overdueModel({
            organizationId: orgOid,
            dealId: dealOid,
            clientId: clientOid,
            overdueAmount,
            overdueDays,
            status: overdue_schema_1.OverdueStatus.NEW,
        });
        return overdue.save();
    }
    async updateStatus(orgId, overdueId, dto, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(overdueId)) {
            throw new common_1.BadRequestException('Invalid overdue ID');
        }
        const overdue = await this.overdueModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(overdueId),
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        })
            .exec();
        if (!overdue) {
            throw new common_1.NotFoundException(`Overdue record with ID "${overdueId}" not found`);
        }
        if (overdue.status === overdue_schema_1.OverdueStatus.RESOLVED) {
            throw new common_1.BadRequestException('Cannot update a resolved overdue record');
        }
        if (dto.status !== undefined) {
            overdue.status = dto.status;
        }
        if (dto.lastContactDate !== undefined) {
            overdue.lastContactDate = new Date(dto.lastContactDate);
        }
        if (dto.promisedPaymentDate !== undefined) {
            overdue.promisedPaymentDate = new Date(dto.promisedPaymentDate);
        }
        if (dto.managerComment !== undefined) {
            overdue.managerComment = dto.managerComment;
        }
        if (dto.assignedTo !== undefined) {
            overdue.assignedTo = new mongoose_2.Types.ObjectId(dto.assignedTo);
        }
        this.logger.log(`Overdue ${overdueId} status updated by user ${userId}: ${JSON.stringify(dto)}`);
        return overdue.save();
    }
    async resolve(orgId, overdueId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(overdueId)) {
            throw new common_1.BadRequestException('Invalid overdue ID');
        }
        const overdue = await this.overdueModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(overdueId),
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        })
            .exec();
        if (!overdue) {
            throw new common_1.NotFoundException(`Overdue record with ID "${overdueId}" not found`);
        }
        if (overdue.status === overdue_schema_1.OverdueStatus.RESOLVED) {
            throw new common_1.BadRequestException('Overdue record is already resolved');
        }
        overdue.status = overdue_schema_1.OverdueStatus.RESOLVED;
        this.logger.log(`Overdue ${overdueId} resolved by user ${userId}`);
        return overdue.save();
    }
    async getStats(orgId) {
        const orgOid = new mongoose_2.Types.ObjectId(orgId);
        const [aggregateResult, statusBreakdown] = await Promise.all([
            this.overdueModel
                .aggregate([
                {
                    $match: {
                        organizationId: orgOid,
                        status: { $ne: overdue_schema_1.OverdueStatus.RESOLVED },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 },
                        totalAmount: { $sum: '$overdueAmount' },
                        averageDays: { $avg: '$overdueDays' },
                    },
                },
            ])
                .exec(),
            this.overdueModel
                .aggregate([
                {
                    $match: {
                        organizationId: orgOid,
                        status: { $ne: overdue_schema_1.OverdueStatus.RESOLVED },
                    },
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ])
                .exec(),
        ]);
        const stats = aggregateResult[0] || {
            totalCount: 0,
            totalAmount: 0,
            averageDays: 0,
        };
        const byStatus = {};
        for (const item of statusBreakdown) {
            byStatus[item._id] = item.count;
        }
        return {
            totalCount: stats.totalCount,
            totalAmount: stats.totalAmount,
            averageDays: Math.round(stats.averageDays * 100) / 100,
            byStatus,
        };
    }
    async syncOverdueFromDeals(orgId) {
        const orgOid = new mongoose_2.Types.ObjectId(orgId);
        const now = new Date();
        let created = 0;
        let updated = 0;
        const activeDeals = await this.dealModel
            .find({
            organizationId: orgOid,
            status: { $in: [deal_schema_1.DealStatus.ACTIVE, deal_schema_1.DealStatus.OVERDUE] },
        })
            .exec();
        for (const deal of activeDeals) {
            let totalOverdueAmount = 0;
            let maxOverdueDays = 0;
            for (const payment of deal.paymentSchedule) {
                if (payment.status === deal_schema_1.PaymentScheduleStatus.OVERDUE ||
                    (payment.status === deal_schema_1.PaymentScheduleStatus.PENDING && new Date(payment.date) < now)) {
                    totalOverdueAmount += payment.amount;
                    const diffMs = now.getTime() - new Date(payment.date).getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    if (diffDays > maxOverdueDays) {
                        maxOverdueDays = diffDays;
                    }
                }
            }
            if (totalOverdueAmount > 0 && maxOverdueDays > 0) {
                const existing = await this.overdueModel
                    .findOne({
                    organizationId: orgOid,
                    dealId: deal._id,
                    status: { $ne: overdue_schema_1.OverdueStatus.RESOLVED },
                })
                    .exec();
                if (existing) {
                    existing.overdueAmount = totalOverdueAmount;
                    existing.overdueDays = maxOverdueDays;
                    await existing.save();
                    updated++;
                }
                else {
                    const overdue = new this.overdueModel({
                        organizationId: orgOid,
                        dealId: deal._id,
                        clientId: deal.clientId,
                        overdueAmount: totalOverdueAmount,
                        overdueDays: maxOverdueDays,
                        status: overdue_schema_1.OverdueStatus.NEW,
                    });
                    await overdue.save();
                    created++;
                }
            }
        }
        this.logger.log(`Overdue sync completed for org ${orgId}: created=${created}, updated=${updated}`);
        return { created, updated };
    }
};
exports.OverdueService = OverdueService;
exports.OverdueService = OverdueService = OverdueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(overdue_schema_1.Overdue.name)),
    __param(1, (0, mongoose_1.InjectModel)(deal_schema_1.Deal.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], OverdueService);
//# sourceMappingURL=overdue.service.js.map