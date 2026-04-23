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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const payment_schema_1 = require("./schemas/payment.schema");
const deal_schema_1 = require("../deals/schemas/deal.schema");
const client_schema_1 = require("../clients/schemas/client.schema");
const deals_service_1 = require("../deals/deals.service");
const sms_service_1 = require("../sms/sms.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(paymentModel, dealModel, clientModel, dealsService, smsService) {
        this.paymentModel = paymentModel;
        this.dealModel = dealModel;
        this.clientModel = clientModel;
        this.dealsService = dealsService;
        this.smsService = smsService;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    async create(orgId, dto, userId) {
        const deal = await this.dealModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(dto.dealId),
            organizationId: orgId,
        })
            .exec();
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        if (deal.status === deal_schema_1.DealStatus.CLOSED) {
            throw new common_1.BadRequestException('Cannot add payment to a closed deal');
        }
        if (deal.status === deal_schema_1.DealStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot add payment to a cancelled deal');
        }
        if (dto.amount > deal.remainingAmount) {
            throw new common_1.BadRequestException(`Payment amount (${dto.amount}) exceeds remaining amount (${deal.remainingAmount})`);
        }
        const scheduledDate = this.findAndUpdateScheduleEntry(deal, dto.amount);
        const newRemaining = Math.round((deal.remainingAmount - dto.amount) * 100) / 100;
        const payment = new this.paymentModel({
            organizationId: orgId,
            dealId: deal._id,
            clientId: deal.clientId,
            amount: dto.amount,
            paymentDate: new Date(dto.paymentDate),
            paymentMethod: dto.paymentMethod,
            scheduledDate: scheduledDate || undefined,
            isEarly: false,
            remainingAfterPayment: Math.max(0, newRemaining),
            comment: dto.comment || null,
            createdBy: userId,
        });
        const savedPayment = await payment.save();
        deal.remainingAmount = Math.max(0, newRemaining);
        if (deal.remainingAmount <= 0) {
            deal.status = deal_schema_1.DealStatus.CLOSED;
        }
        else if (deal.status === deal_schema_1.DealStatus.OVERDUE) {
            const hasOverdue = deal.paymentSchedule.some((entry) => entry.status === deal_schema_1.PaymentScheduleStatus.OVERDUE);
            if (!hasOverdue) {
                deal.status = deal_schema_1.DealStatus.ACTIVE;
            }
        }
        deal.markModified('paymentSchedule');
        await deal.save();
        await this.dealsService.updatePaymentScheduleStatus(deal._id);
        try {
            await this.smsService.notifyPayment(orgId, deal, savedPayment);
        }
        catch (err) {
            this.logger.warn(`Failed to send payment SMS for deal ${deal._id}: ${err.message}`);
        }
        return savedPayment;
    }
    async findAll(orgId, query) {
        const { page = 1, limit = 20, dealId, clientId, dateFrom, dateTo, paymentMethod, sortBy = 'paymentDate', sortOrder = 'desc' } = query;
        const filter = { organizationId: orgId };
        if (dealId) {
            filter.dealId = new mongoose_2.Types.ObjectId(dealId);
        }
        if (clientId) {
            filter.clientId = new mongoose_2.Types.ObjectId(clientId);
        }
        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }
        if (dateFrom || dateTo) {
            filter.paymentDate = {};
            if (dateFrom) {
                filter.paymentDate.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                filter.paymentDate.$lte = new Date(dateTo);
            }
        }
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const [data, total] = await Promise.all([
            this.paymentModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('dealId', 'dealNumber productDescription status')
                .populate('clientId', 'firstName lastName phone')
                .exec(),
            this.paymentModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async findById(orgId, paymentId) {
        const payment = await this.paymentModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(paymentId),
            organizationId: orgId,
        })
            .populate('dealId', 'dealNumber productDescription status clientId')
            .populate('clientId', 'firstName lastName phone')
            .exec();
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        return payment;
    }
    async getPaymentsByDeal(orgId, dealId) {
        return this.paymentModel
            .find({
            organizationId: orgId,
            dealId: new mongoose_2.Types.ObjectId(dealId),
        })
            .sort({ createdAt: -1 })
            .populate('clientId', 'firstName lastName phone')
            .exec();
    }
    async getPaymentsByClient(orgId, clientId) {
        return this.paymentModel
            .find({
            organizationId: orgId,
            clientId: new mongoose_2.Types.ObjectId(clientId),
        })
            .sort({ createdAt: -1 })
            .populate('dealId', 'dealNumber productDescription status')
            .exec();
    }
    async getStats(orgId, dateFrom, dateTo) {
        const matchStage = {
            organizationId: orgId,
        };
        if (dateFrom || dateTo) {
            matchStage.paymentDate = {};
            if (dateFrom) {
                matchStage.paymentDate.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                matchStage.paymentDate.$lte = new Date(dateTo);
            }
        }
        const pipeline = [
            { $match: matchStage },
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalCollected: { $sum: '$amount' },
                                totalCount: { $sum: 1 },
                            },
                        },
                    ],
                    byMethod: [
                        {
                            $group: {
                                _id: '$paymentMethod',
                                count: { $sum: 1 },
                                total: { $sum: '$amount' },
                            },
                        },
                    ],
                },
            },
        ];
        const [result] = await this.paymentModel.aggregate(pipeline).exec();
        const totals = result?.totals?.[0] || {
            totalCollected: 0,
            totalCount: 0,
        };
        const byMethod = {};
        for (const method of Object.values(payment_schema_1.PaymentMethod)) {
            byMethod[method] = { count: 0, total: 0 };
        }
        if (result?.byMethod) {
            for (const entry of result.byMethod) {
                byMethod[entry._id] = { count: entry.count, total: entry.total };
            }
        }
        return {
            totalCollected: totals.totalCollected,
            totalCount: totals.totalCount,
            byMethod,
        };
    }
    async earlyRepayment(orgId, dealId, amount, userId) {
        const deal = await this.dealModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(dealId),
            organizationId: orgId,
        })
            .exec();
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        if (deal.status === deal_schema_1.DealStatus.CLOSED) {
            throw new common_1.BadRequestException('Deal is already closed');
        }
        if (deal.status === deal_schema_1.DealStatus.CANCELLED) {
            throw new common_1.BadRequestException('Deal is cancelled');
        }
        if (amount > deal.remainingAmount) {
            throw new common_1.BadRequestException(`Early repayment amount (${amount}) exceeds remaining amount (${deal.remainingAmount})`);
        }
        const newRemaining = Math.round((deal.remainingAmount - amount) * 100) / 100;
        this.applyEarlyRepaymentToSchedule(deal, amount);
        const payment = new this.paymentModel({
            organizationId: orgId,
            dealId: deal._id,
            clientId: deal.clientId,
            amount,
            paymentDate: new Date(),
            paymentMethod: payment_schema_1.PaymentMethod.TRANSFER,
            isEarly: true,
            remainingAfterPayment: Math.max(0, newRemaining),
            comment: `Early repayment${newRemaining <= 0 ? ' - full closure' : ''}`,
            createdBy: userId,
        });
        const savedPayment = await payment.save();
        deal.remainingAmount = Math.max(0, newRemaining);
        if (deal.remainingAmount <= 0) {
            deal.status = deal_schema_1.DealStatus.CLOSED;
            for (const entry of deal.paymentSchedule) {
                if (entry.status === deal_schema_1.PaymentScheduleStatus.PENDING ||
                    entry.status === deal_schema_1.PaymentScheduleStatus.PARTIAL ||
                    entry.status === deal_schema_1.PaymentScheduleStatus.OVERDUE) {
                    entry.status = deal_schema_1.PaymentScheduleStatus.PAID;
                }
            }
        }
        deal.markModified('paymentSchedule');
        await deal.save();
        return savedPayment;
    }
    findAndUpdateScheduleEntry(deal, paymentAmount) {
        let targetEntry = deal.paymentSchedule.find((e) => e.status === deal_schema_1.PaymentScheduleStatus.OVERDUE);
        if (!targetEntry) {
            targetEntry = deal.paymentSchedule.find((e) => e.status === deal_schema_1.PaymentScheduleStatus.PARTIAL ||
                e.status === deal_schema_1.PaymentScheduleStatus.PENDING);
        }
        if (!targetEntry) {
            return null;
        }
        if (paymentAmount >= targetEntry.amount) {
            targetEntry.status = deal_schema_1.PaymentScheduleStatus.PAID;
        }
        else {
            targetEntry.status = deal_schema_1.PaymentScheduleStatus.PARTIAL;
        }
        return targetEntry.date;
    }
    applyEarlyRepaymentToSchedule(deal, totalAmount) {
        let remaining = totalAmount;
        for (const entry of deal.paymentSchedule) {
            if (remaining <= 0)
                break;
            if (entry.status === deal_schema_1.PaymentScheduleStatus.OVERDUE ||
                entry.status === deal_schema_1.PaymentScheduleStatus.PARTIAL ||
                entry.status === deal_schema_1.PaymentScheduleStatus.PENDING) {
                if (remaining >= entry.amount) {
                    entry.status = deal_schema_1.PaymentScheduleStatus.PAID;
                    remaining -= entry.amount;
                }
                else {
                    entry.status = deal_schema_1.PaymentScheduleStatus.PARTIAL;
                    remaining = 0;
                }
            }
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(1, (0, mongoose_1.InjectModel)(deal_schema_1.Deal.name)),
    __param(2, (0, mongoose_1.InjectModel)(client_schema_1.Client.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        deals_service_1.DealsService,
        sms_service_1.SmsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map