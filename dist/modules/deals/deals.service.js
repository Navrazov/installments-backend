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
var DealsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const deal_schema_1 = require("./schemas/deal.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const create_deal_dto_1 = require("./dto/create-deal.dto");
const contracts_service_1 = require("../contracts/contracts.service");
const sms_service_1 = require("../sms/sms.service");
let DealsService = DealsService_1 = class DealsService {
    constructor(dealModel, paymentModel, contractsService, smsService) {
        this.dealModel = dealModel;
        this.paymentModel = paymentModel;
        this.contractsService = contractsService;
        this.smsService = smsService;
        this.logger = new common_1.Logger(DealsService_1.name);
    }
    async create(orgId, dto, userId) {
        const dealNumber = await this.generateDealNumber();
        const purchasePrice = dto.purchasePrice ?? 0;
        const totalAmount = dto.salePrice;
        const markup = Math.max(0, dto.salePrice - purchasePrice);
        const markupPercent = purchasePrice > 0 ? (markup / purchasePrice) * 100 : 0;
        const remainingAmount = totalAmount - dto.downPayment;
        const rawMonthlyPayment = remainingAmount / dto.termMonths;
        const monthlyPayment = this.applyRounding(rawMonthlyPayment, dto.roundingMode);
        const startDate = new Date(dto.startDate);
        const firstPaymentDate = dto.firstPaymentDate
            ? new Date(dto.firstPaymentDate)
            : (() => {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() + 1);
                return d;
            })();
        const paymentSchedule = this.generatePaymentSchedule(firstPaymentDate, dto.termMonths, monthlyPayment, remainingAmount);
        const endDate = new Date(firstPaymentDate);
        endDate.setMonth(endDate.getMonth() + dto.termMonths - 1);
        const deal = new this.dealModel({
            organizationId: orgId,
            clientId: new mongoose_2.Types.ObjectId(dto.clientId),
            dealNumber,
            productDescription: dto.productDescription,
            purchasePrice,
            salePrice: dto.salePrice,
            markup: Math.round(markup * 100) / 100,
            markupPercent: Math.round(markupPercent * 100) / 100,
            downPayment: dto.downPayment,
            totalAmount,
            remainingAmount,
            termMonths: dto.termMonths,
            monthlyPayment,
            startDate,
            firstPaymentDate,
            endDate,
            paymentSchedule,
            status: deal_schema_1.DealStatus.ACTIVE,
            managerId: userId,
            comments: dto.comments || null,
            createdBy: userId,
        });
        const saved = await deal.save();
        try {
            await this.contractsService.createFromDeal(orgId, saved._id);
        }
        catch (err) {
            this.logger.warn(`Failed to auto-generate contract for deal ${saved._id}: ${err.message}`);
        }
        try {
            await this.smsService.notifyDealCreated(orgId, saved);
        }
        catch (err) {
            this.logger.warn(`Failed to send SMS notification for deal ${saved._id}: ${err.message}`);
        }
        return saved;
    }
    applyRounding(value, mode) {
        if (mode === create_deal_dto_1.RoundingMode.UP) {
            return Math.ceil(value / 100) * 100;
        }
        if (mode === create_deal_dto_1.RoundingMode.DOWN) {
            return Math.floor(value / 100) * 100;
        }
        return Math.round(value * 100) / 100;
    }
    async findAll(orgId, query) {
        const { page = 1, limit = 20, status, clientId, managerId, startDateFrom, startDateTo, sortBy = 'createdAt', sortOrder = 'desc' } = query;
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
        const needsRecalc = dto.salePrice !== undefined ||
            dto.downPayment !== undefined ||
            dto.termMonths !== undefined ||
            dto.startDate !== undefined ||
            dto.firstPaymentDate !== undefined;
        if (needsRecalc) {
            const salePrice = dto.salePrice ?? deal.salePrice;
            const downPayment = dto.downPayment ?? deal.downPayment;
            const termMonths = dto.termMonths ?? deal.termMonths;
            const startDate = dto.startDate ? new Date(dto.startDate) : deal.startDate;
            const firstPaymentDate = dto.firstPaymentDate
                ? new Date(dto.firstPaymentDate)
                : deal.firstPaymentDate ?? (() => {
                    const d = new Date(startDate);
                    d.setMonth(d.getMonth() + 1);
                    return d;
                })();
            const totalAmount = salePrice;
            const remainingAmountBase = totalAmount - downPayment;
            const monthlyPayment = remainingAmountBase / termMonths;
            const totalPaid = totalAmount - deal.remainingAmount - deal.downPayment;
            const newRemaining = remainingAmountBase - totalPaid;
            const endDate = new Date(firstPaymentDate);
            endDate.setMonth(endDate.getMonth() + termMonths - 1);
            const paymentSchedule = this.generatePaymentSchedule(firstPaymentDate, termMonths, monthlyPayment, remainingAmountBase);
            updateData.totalAmount = totalAmount;
            updateData.remainingAmount = Math.max(0, newRemaining);
            updateData.monthlyPayment = Math.round(monthlyPayment * 100) / 100;
            updateData.startDate = startDate;
            updateData.firstPaymentDate = firstPaymentDate;
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
                try {
                    await this.smsService.notifyOverdue(deal.organizationId, deal);
                }
                catch (err) {
                    this.logger.warn(`Failed to send overdue SMS for deal ${deal._id}: ${err.message}`);
                }
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
    async getUpcomingPayments(orgId, days = 7) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const future = new Date(now);
        future.setDate(future.getDate() + days);
        const deals = await this.dealModel
            .find({
            organizationId: orgId,
            status: { $in: [deal_schema_1.DealStatus.ACTIVE, deal_schema_1.DealStatus.OVERDUE] },
        })
            .populate('clientId', 'firstName lastName phone')
            .select('dealNumber clientId paymentSchedule')
            .exec();
        const result = [];
        for (const deal of deals) {
            const client = deal.clientId;
            const clientName = client
                ? `${client.lastName} ${client.firstName}`
                : '—';
            const clientPhone = client?.phone || '';
            for (const entry of deal.paymentSchedule) {
                if (entry.status === deal_schema_1.PaymentScheduleStatus.PAID)
                    continue;
                const entryDate = new Date(entry.date);
                entryDate.setHours(0, 0, 0, 0);
                if (entryDate <= future) {
                    const daysUntil = Math.ceil((entryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    result.push({
                        dealId: deal._id.toString(),
                        dealNumber: deal.dealNumber,
                        clientName,
                        clientPhone,
                        date: entry.date,
                        amount: entry.amount,
                        daysUntil,
                        status: entry.status,
                    });
                }
            }
        }
        return result.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 30);
    }
    generatePaymentSchedule(firstPaymentDate, termMonths, monthlyPayment, remainingAmount) {
        const schedule = [];
        const roundedPayment = Math.round(monthlyPayment * 100) / 100;
        for (let i = 0; i < termMonths; i++) {
            const paymentDate = new Date(firstPaymentDate);
            paymentDate.setMonth(paymentDate.getMonth() + i);
            schedule.push({
                date: paymentDate,
                amount: roundedPayment,
                status: deal_schema_1.PaymentScheduleStatus.PENDING,
            });
        }
        if (remainingAmount !== undefined && schedule.length > 0) {
            const totalScheduled = roundedPayment * termMonths;
            const diff = Math.round((remainingAmount - totalScheduled) * 100) / 100;
            if (diff !== 0) {
                const last = schedule[schedule.length - 1];
                last.amount = Math.max(0, Math.round((last.amount + diff) * 100) / 100);
            }
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
exports.DealsService = DealsService = DealsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(deal_schema_1.Deal.name)),
    __param(1, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => contracts_service_1.ContractsService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => sms_service_1.SmsService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        contracts_service_1.ContractsService,
        sms_service_1.SmsService])
], DealsService);
//# sourceMappingURL=deals.service.js.map