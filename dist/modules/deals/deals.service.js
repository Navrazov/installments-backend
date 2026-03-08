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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const deal_schema_1 = require("./schemas/deal.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
let DealsService = class DealsService {
    constructor(dealModel, paymentModel) {
        this.dealModel = dealModel;
        this.paymentModel = paymentModel;
    }
    async create(orgId, dto, userId) {
        const dealNumber = await this.generateDealNumber();
        const totalAmount = dto.salePrice;
        const remainingAmount = totalAmount - dto.downPayment;
        const monthlyPayment = remainingAmount / dto.termMonths;
        const startDate = new Date(dto.startDate);
        const paymentSchedule = this.generatePaymentSchedule(startDate, dto.termMonths, monthlyPayment);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + dto.termMonths);
        const deal = new this.dealModel({
            organizationId: orgId,
            clientId: new mongoose_2.Types.ObjectId(dto.clientId),
            dealNumber,
            productDescription: dto.productDescription,
            purchasePrice: dto.purchasePrice,
            salePrice: dto.salePrice,
            markup: dto.markup,
            markupPercent: dto.markupPercent,
            downPayment: dto.downPayment,
            totalAmount,
            remainingAmount,
            termMonths: dto.termMonths,
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            startDate,
            endDate,
            paymentSchedule,
            status: deal_schema_1.DealStatus.ACTIVE,
            branchName: dto.branchName || null,
            managerId: new mongoose_2.Types.ObjectId(dto.managerId),
            guarantorId: dto.guarantorId
                ? new mongoose_2.Types.ObjectId(dto.guarantorId)
                : undefined,
            comments: dto.comments || null,
            createdBy: userId,
        });
        return deal.save();
    }
    async findAll(orgId, query) {
        const { page = 1, limit = 20, status, clientId, managerId, branchName, startDateFrom, startDateTo, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const filter = { organizationId: orgId };
        if (status) {
            filter.status = status;
        }
        if (clientId) {
            filter.clientId = new mongoose_2.Types.ObjectId(clientId);
        }
        if (managerId) {
            filter.managerId = new mongoose_2.Types.ObjectId(managerId);
        }
        if (branchName) {
            filter.branchName = branchName;
        }
        if (startDateFrom || startDateTo) {
            filter.startDate = {};
            if (startDateFrom) {
                filter.startDate.$gte = new Date(startDateFrom);
            }
            if (startDateTo) {
                filter.startDate.$lte = new Date(startDateTo);
            }
        }
        const sort = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.dealModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('clientId', 'firstName lastName phone')
                .populate('managerId', 'firstName lastName email')
                .exec(),
            this.dealModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async findById(orgId, dealId) {
        const deal = await this.dealModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(dealId),
            organizationId: orgId,
        })
            .populate('clientId', 'firstName lastName phone address')
            .populate('managerId', 'firstName lastName email')
            .populate('guarantorId', 'firstName lastName phone')
            .exec();
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        return deal;
    }
    async update(orgId, dealId, dto, userId) {
        const deal = await this.findById(orgId, dealId);
        if (deal.status === deal_schema_1.DealStatus.CLOSED || deal.status === deal_schema_1.DealStatus.CANCELLED) {
            throw new common_1.BadRequestException(`Cannot update a deal with status "${deal.status}"`);
        }
        const updateData = { ...dto };
        if (dto.managerId) {
            updateData.managerId = new mongoose_2.Types.ObjectId(dto.managerId);
        }
        if (dto.guarantorId) {
            updateData.guarantorId = new mongoose_2.Types.ObjectId(dto.guarantorId);
        }
        const needsRecalc = dto.salePrice !== undefined ||
            dto.downPayment !== undefined ||
            dto.termMonths !== undefined ||
            dto.startDate !== undefined;
        if (needsRecalc) {
            const salePrice = dto.salePrice ?? deal.salePrice;
            const downPayment = dto.downPayment ?? deal.downPayment;
            const termMonths = dto.termMonths ?? deal.termMonths;
            const startDate = dto.startDate ? new Date(dto.startDate) : deal.startDate;
            const totalAmount = salePrice;
            const remainingAmountBase = totalAmount - downPayment;
            const monthlyPayment = remainingAmountBase / termMonths;
            const totalPaid = totalAmount - deal.remainingAmount - deal.downPayment;
            const newRemaining = remainingAmountBase - totalPaid;
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + termMonths);
            const paymentSchedule = this.generatePaymentSchedule(startDate, termMonths, monthlyPayment);
            updateData.totalAmount = totalAmount;
            updateData.remainingAmount = Math.max(0, newRemaining);
            updateData.monthlyPayment = Math.round(monthlyPayment * 100) / 100;
            updateData.startDate = startDate;
            updateData.endDate = endDate;
            updateData.paymentSchedule = paymentSchedule;
        }
        const updated = await this.dealModel
            .findOneAndUpdate({ _id: deal._id, organizationId: orgId }, { $set: updateData }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException('Deal not found');
        }
        return updated;
    }
    async cancel(orgId, dealId, userId) {
        const deal = await this.findById(orgId, dealId);
        if (deal.status === deal_schema_1.DealStatus.CLOSED) {
            throw new common_1.BadRequestException('Cannot cancel a closed deal');
        }
        if (deal.status === deal_schema_1.DealStatus.CANCELLED) {
            throw new common_1.BadRequestException('Deal is already cancelled');
        }
        deal.status = deal_schema_1.DealStatus.CANCELLED;
        return deal.save();
    }
    async close(orgId, dealId, userId) {
        const deal = await this.findById(orgId, dealId);
        if (deal.status === deal_schema_1.DealStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot close a cancelled deal');
        }
        if (deal.status === deal_schema_1.DealStatus.CLOSED) {
            throw new common_1.BadRequestException('Deal is already closed');
        }
        deal.status = deal_schema_1.DealStatus.CLOSED;
        return deal.save();
    }
    async getDealPayments(orgId, dealId) {
        await this.findById(orgId, dealId);
        return this.paymentModel
            .find({
            organizationId: orgId,
            dealId: new mongoose_2.Types.ObjectId(dealId),
        })
            .sort({ createdAt: -1 })
            .exec();
    }
    async updatePaymentScheduleStatus(dealId) {
        const deal = await this.dealModel.findById(dealId).exec();
        if (!deal)
            return;
        const now = new Date();
        const payments = await this.paymentModel
            .find({ dealId: deal._id })
            .sort({ paymentDate: 1 })
            .exec();
        let totalPaidSoFar = 0;
        for (const payment of payments) {
            totalPaidSoFar += payment.amount;
        }
        let cumulativeScheduled = 0;
        for (const entry of deal.paymentSchedule) {
            cumulativeScheduled += entry.amount;
            if (totalPaidSoFar >= cumulativeScheduled) {
                entry.status = deal_schema_1.PaymentScheduleStatus.PAID;
            }
            else if (totalPaidSoFar > cumulativeScheduled - entry.amount) {
                entry.status = deal_schema_1.PaymentScheduleStatus.PARTIAL;
            }
            else if (new Date(entry.date) < now) {
                entry.status = deal_schema_1.PaymentScheduleStatus.OVERDUE;
            }
            else {
                entry.status = deal_schema_1.PaymentScheduleStatus.PENDING;
            }
        }
        deal.markModified('paymentSchedule');
        await deal.save();
    }
    async checkOverdue() {
        const now = new Date();
        const deals = await this.dealModel
            .find({
            status: deal_schema_1.DealStatus.ACTIVE,
            'paymentSchedule.date': { $lt: now },
            'paymentSchedule.status': {
                $in: [deal_schema_1.PaymentScheduleStatus.PENDING, deal_schema_1.PaymentScheduleStatus.PARTIAL],
            },
        })
            .exec();
        for (const deal of deals) {
            let hasOverdue = false;
            for (const entry of deal.paymentSchedule) {
                if (new Date(entry.date) < now &&
                    (entry.status === deal_schema_1.PaymentScheduleStatus.PENDING ||
                        entry.status === deal_schema_1.PaymentScheduleStatus.PARTIAL)) {
                    entry.status = deal_schema_1.PaymentScheduleStatus.OVERDUE;
                    hasOverdue = true;
                }
            }
            if (hasOverdue) {
                deal.status = deal_schema_1.DealStatus.OVERDUE;
                deal.markModified('paymentSchedule');
                await deal.save();
            }
        }
    }
    async getStats(orgId) {
        const pipeline = [
            { $match: { organizationId: orgId } },
            {
                $group: {
                    _id: null,
                    totalDeals: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.ACTIVE] }, 1, 0] },
                    },
                    closed: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.CLOSED] }, 1, 0] },
                    },
                    overdue: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.OVERDUE] }, 1, 0] },
                    },
                    cancelled: {
                        $sum: {
                            $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.CANCELLED] }, 1, 0],
                        },
                    },
                    totalVolume: { $sum: '$totalAmount' },
                    totalCollected: {
                        $sum: { $subtract: ['$totalAmount', '$remainingAmount'] },
                    },
                    totalRemaining: { $sum: '$remainingAmount' },
                },
            },
        ];
        const [result] = await this.dealModel.aggregate(pipeline).exec();
        return (result || {
            totalDeals: 0,
            active: 0,
            closed: 0,
            overdue: 0,
            cancelled: 0,
            totalVolume: 0,
            totalCollected: 0,
            totalRemaining: 0,
        });
    }
    generatePaymentSchedule(startDate, termMonths, monthlyPayment) {
        const schedule = [];
        const roundedPayment = Math.round(monthlyPayment * 100) / 100;
        for (let i = 1; i <= termMonths; i++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + i);
            schedule.push({
                date: paymentDate,
                amount: roundedPayment,
                status: deal_schema_1.PaymentScheduleStatus.PENDING,
            });
        }
        return schedule;
    }
    async generateDealNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        const prefix = `HL-${dateStr}-`;
        const lastDeal = await this.dealModel
            .findOne({
            dealNumber: { $regex: `^${prefix}` },
        })
            .sort({ dealNumber: -1 })
            .select('dealNumber')
            .exec();
        let sequence = 1;
        if (lastDeal) {
            const lastSeq = parseInt(lastDeal.dealNumber.split('-').pop() || '0', 10);
            sequence = lastSeq + 1;
        }
        const seqStr = String(sequence).padStart(4, '0');
        return `${prefix}${seqStr}`;
    }
};
exports.DealsService = DealsService;
exports.DealsService = DealsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(deal_schema_1.Deal.name)),
    __param(1, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], DealsService);
//# sourceMappingURL=deals.service.js.map