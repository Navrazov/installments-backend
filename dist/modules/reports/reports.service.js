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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const deal_schema_1 = require("../deals/schemas/deal.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const client_schema_1 = require("../clients/schemas/client.schema");
const overdue_schema_1 = require("../overdue/schemas/overdue.schema");
let ReportsService = class ReportsService {
    constructor(dealModel, paymentModel, clientModel, overdueModel) {
        this.dealModel = dealModel;
        this.paymentModel = paymentModel;
        this.clientModel = clientModel;
        this.overdueModel = overdueModel;
    }
    async getDashboardSummary(orgId) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [dealStats, paymentStats, overdueStats, newClientsThisMonth] = await Promise.all([
            this.dealModel.aggregate([
                { $match: { organizationId } },
                {
                    $group: {
                        _id: null,
                        totalDeals: { $sum: 1 },
                        activeDeals: {
                            $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.ACTIVE] }, 1, 0] },
                        },
                        closedDeals: {
                            $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.CLOSED] }, 1, 0] },
                        },
                        overdueDeals: {
                            $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.OVERDUE] }, 1, 0] },
                        },
                        totalVolume: { $sum: '$salePrice' },
                        totalRemainingAmount: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', [deal_schema_1.DealStatus.ACTIVE, deal_schema_1.DealStatus.OVERDUE]] },
                                    '$remainingAmount',
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
            this.paymentModel.aggregate([
                { $match: { organizationId } },
                {
                    $group: {
                        _id: null,
                        totalCollected: { $sum: '$amount' },
                    },
                },
            ]),
            this.overdueModel.aggregate([
                {
                    $match: {
                        organizationId,
                        status: { $ne: overdue_schema_1.OverdueStatus.RESOLVED },
                    },
                },
                {
                    $group: {
                        _id: null,
                        overdueReceivable: { $sum: '$overdueAmount' },
                        averageOverdueDays: { $avg: '$overdueDays' },
                    },
                },
            ]),
            this.clientModel.countDocuments({
                organizationId,
                createdAt: { $gte: monthStart },
            }),
        ]);
        const deals = dealStats[0] || {
            totalDeals: 0,
            activeDeals: 0,
            closedDeals: 0,
            overdueDeals: 0,
            totalVolume: 0,
            totalRemainingAmount: 0,
        };
        const payments = paymentStats[0] || { totalCollected: 0 };
        const overdue = overdueStats[0] || { overdueReceivable: 0, averageOverdueDays: 0 };
        return {
            totalDeals: deals.totalDeals,
            activeDeals: deals.activeDeals,
            closedDeals: deals.closedDeals,
            overdueDeals: deals.overdueDeals,
            totalVolume: deals.totalVolume,
            totalCollected: payments.totalCollected,
            totalReceivable: deals.totalRemainingAmount,
            overdueReceivable: overdue.overdueReceivable,
            newClientsThisMonth,
            averageOverdueDays: Math.round(overdue.averageOverdueDays || 0),
        };
    }
    async getDealsReport(orgId, dateFrom, dateTo) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const matchStage = { organizationId };
        if (dateFrom || dateTo) {
            matchStage.createdAt = {};
            if (dateFrom)
                matchStage.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                matchStage.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }
        const [byStatus, volumeOverTime] = await Promise.all([
            this.dealModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalVolume: { $sum: '$salePrice' },
                        avgDealSize: { $avg: '$salePrice' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            this.dealModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                        totalVolume: { $sum: '$salePrice' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        count: 1,
                        totalVolume: 1,
                    },
                },
            ]),
        ]);
        const totalDeals = byStatus.reduce((sum, s) => sum + s.count, 0);
        const totalVolume = byStatus.reduce((sum, s) => sum + s.totalVolume, 0);
        return {
            totalDeals,
            totalVolume,
            byStatus,
            volumeOverTime,
        };
    }
    async getPaymentsReport(orgId, dateFrom, dateTo) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const matchStage = { organizationId };
        if (dateFrom || dateTo) {
            matchStage.paymentDate = {};
            if (dateFrom)
                matchStage.paymentDate.$gte = new Date(dateFrom);
            if (dateTo)
                matchStage.paymentDate.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }
        const [byMonth, byMethod, totals] = await Promise.all([
            this.paymentModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: {
                            year: { $year: '$paymentDate' },
                            month: { $month: '$paymentDate' },
                        },
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        count: 1,
                        totalAmount: 1,
                    },
                },
            ]),
            this.paymentModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: '$paymentMethod',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' },
                    },
                },
                { $sort: { totalAmount: -1 } },
            ]),
            this.paymentModel.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: null,
                        totalPayments: { $sum: 1 },
                        totalCollected: { $sum: '$amount' },
                        earlyPayments: {
                            $sum: { $cond: ['$isEarly', 1, 0] },
                        },
                    },
                },
            ]),
        ]);
        const dealTotals = await this.dealModel.aggregate([
            {
                $match: {
                    organizationId,
                    status: { $in: [deal_schema_1.DealStatus.ACTIVE, deal_schema_1.DealStatus.OVERDUE, deal_schema_1.DealStatus.CLOSED] },
                },
            },
            {
                $group: {
                    _id: null,
                    totalExpected: { $sum: '$totalAmount' },
                },
            },
        ]);
        const totalExpected = dealTotals[0]?.totalExpected || 0;
        const totalCollected = totals[0]?.totalCollected || 0;
        const collectionRate = totalExpected > 0
            ? Math.round((totalCollected / totalExpected) * 10000) / 100
            : 0;
        return {
            totalPayments: totals[0]?.totalPayments || 0,
            totalCollected,
            earlyPayments: totals[0]?.earlyPayments || 0,
            collectionRate,
            byMonth,
            byMethod,
        };
    }
    async getOverdueReport(orgId) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const [summary, byStatus, topOverdueClients] = await Promise.all([
            this.overdueModel.aggregate([
                {
                    $match: {
                        organizationId,
                        status: { $ne: overdue_schema_1.OverdueStatus.RESOLVED },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalOverdueAmount: { $sum: '$overdueAmount' },
                        averageOverdueDays: { $avg: '$overdueDays' },
                        totalOverdueRecords: { $sum: 1 },
                        maxOverdueDays: { $max: '$overdueDays' },
                    },
                },
            ]),
            this.overdueModel.aggregate([
                { $match: { organizationId, status: { $ne: overdue_schema_1.OverdueStatus.RESOLVED } } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$overdueAmount' },
                    },
                },
                { $sort: { totalAmount: -1 } },
            ]),
            this.overdueModel.aggregate([
                {
                    $match: {
                        organizationId,
                        status: { $ne: overdue_schema_1.OverdueStatus.RESOLVED },
                    },
                },
                {
                    $group: {
                        _id: '$clientId',
                        totalOverdueAmount: { $sum: '$overdueAmount' },
                        maxOverdueDays: { $max: '$overdueDays' },
                        overdueCount: { $sum: 1 },
                    },
                },
                { $sort: { totalOverdueAmount: -1 } },
                { $limit: 20 },
                {
                    $lookup: {
                        from: 'clients',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'client',
                    },
                },
                { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        clientId: '$_id',
                        clientName: {
                            $concat: [
                                { $ifNull: ['$client.lastName', ''] },
                                ' ',
                                { $ifNull: ['$client.firstName', ''] },
                            ],
                        },
                        phone: '$client.phone',
                        totalOverdueAmount: 1,
                        maxOverdueDays: 1,
                        overdueCount: 1,
                    },
                },
            ]),
        ]);
        return {
            totalOverdueAmount: summary[0]?.totalOverdueAmount || 0,
            averageOverdueDays: Math.round(summary[0]?.averageOverdueDays || 0),
            totalOverdueRecords: summary[0]?.totalOverdueRecords || 0,
            maxOverdueDays: summary[0]?.maxOverdueDays || 0,
            byStatus,
            topOverdueClients,
        };
    }
    async getClientsReport(orgId) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const now = new Date();
        const [byRiskStatus, newClientsTrend, topClientsByVolume, totalClients] = await Promise.all([
            this.clientModel.aggregate([
                { $match: { organizationId } },
                {
                    $group: {
                        _id: '$riskStatus',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            this.clientModel.aggregate([
                { $match: { organizationId } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 },
                {
                    $project: {
                        _id: 0,
                        year: '$_id.year',
                        month: '$_id.month',
                        count: 1,
                    },
                },
            ]),
            this.dealModel.aggregate([
                {
                    $match: {
                        organizationId,
                        status: { $in: [deal_schema_1.DealStatus.ACTIVE, deal_schema_1.DealStatus.CLOSED, deal_schema_1.DealStatus.OVERDUE] },
                    },
                },
                {
                    $group: {
                        _id: '$clientId',
                        totalVolume: { $sum: '$salePrice' },
                        dealCount: { $sum: 1 },
                    },
                },
                { $sort: { totalVolume: -1 } },
                { $limit: 20 },
                {
                    $lookup: {
                        from: 'clients',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'client',
                    },
                },
                { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        clientId: '$_id',
                        clientName: {
                            $concat: [
                                { $ifNull: ['$client.lastName', ''] },
                                ' ',
                                { $ifNull: ['$client.firstName', ''] },
                            ],
                        },
                        phone: '$client.phone',
                        totalVolume: 1,
                        dealCount: 1,
                    },
                },
            ]),
            this.clientModel.countDocuments({ organizationId }),
        ]);
        return {
            totalClients,
            byRiskStatus,
            newClientsTrend,
            topClientsByVolume,
        };
    }
    async getManagerPerformance(orgId, dateFrom, dateTo) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const matchStage = { organizationId };
        if (dateFrom || dateTo) {
            matchStage.createdAt = {};
            if (dateFrom)
                matchStage.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                matchStage.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }
        const managerDeals = await this.dealModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$managerId',
                    totalDeals: { $sum: 1 },
                    activeDeals: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.ACTIVE] }, 1, 0] },
                    },
                    closedDeals: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.CLOSED] }, 1, 0] },
                    },
                    overdueDeals: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.OVERDUE] }, 1, 0] },
                    },
                    totalVolume: { $sum: '$salePrice' },
                    totalExpected: { $sum: '$totalAmount' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'manager',
                },
            },
            { $unwind: { path: '$manager', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'payments',
                    let: { managerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$organizationId', organizationId] },
                                    ],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: 'deals',
                                localField: 'dealId',
                                foreignField: '_id',
                                as: 'deal',
                            },
                        },
                        { $unwind: '$deal' },
                        {
                            $match: {
                                $expr: { $eq: ['$deal.managerId', '$$managerId'] },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalCollected: { $sum: '$amount' },
                            },
                        },
                    ],
                    as: 'paymentsData',
                },
            },
            {
                $project: {
                    _id: 0,
                    managerId: '$_id',
                    managerName: {
                        $concat: [
                            { $ifNull: ['$manager.lastName', ''] },
                            ' ',
                            { $ifNull: ['$manager.firstName', ''] },
                        ],
                    },
                    email: '$manager.email',
                    totalDeals: 1,
                    activeDeals: 1,
                    closedDeals: 1,
                    overdueDeals: 1,
                    totalVolume: 1,
                    totalExpected: 1,
                    totalCollected: {
                        $ifNull: [{ $arrayElemAt: ['$paymentsData.totalCollected', 0] }, 0],
                    },
                    collectionRate: {
                        $cond: [
                            { $gt: ['$totalExpected', 0] },
                            {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    { $ifNull: [{ $arrayElemAt: ['$paymentsData.totalCollected', 0] }, 0] },
                                                    '$totalExpected',
                                                ],
                                            },
                                            100,
                                        ],
                                    },
                                    2,
                                ],
                            },
                            0,
                        ],
                    },
                },
            },
            { $sort: { totalVolume: -1 } },
        ]);
        return { managers: managerDeals };
    }
    async getBranchPerformance(orgId, dateFrom, dateTo) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const matchStage = { organizationId };
        if (dateFrom || dateTo) {
            matchStage.createdAt = {};
            if (dateFrom)
                matchStage.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                matchStage.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }
        const branches = await this.dealModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $ifNull: ['$branchName', 'Без филиала'] },
                    totalDeals: { $sum: 1 },
                    activeDeals: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.ACTIVE] }, 1, 0] },
                    },
                    closedDeals: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.CLOSED] }, 1, 0] },
                    },
                    overdueDeals: {
                        $sum: { $cond: [{ $eq: ['$status', deal_schema_1.DealStatus.OVERDUE] }, 1, 0] },
                    },
                    totalVolume: { $sum: '$salePrice' },
                    totalExpected: { $sum: '$totalAmount' },
                    totalRemaining: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', [deal_schema_1.DealStatus.ACTIVE, deal_schema_1.DealStatus.OVERDUE]] },
                                '$remainingAmount',
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'payments',
                    let: { branchName: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$organizationId', organizationId] } } },
                        {
                            $lookup: {
                                from: 'deals',
                                localField: 'dealId',
                                foreignField: '_id',
                                as: 'deal',
                            },
                        },
                        { $unwind: '$deal' },
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        { $ifNull: ['$deal.branchName', 'Без филиала'] },
                                        '$$branchName',
                                    ],
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalCollected: { $sum: '$amount' },
                            },
                        },
                    ],
                    as: 'paymentsData',
                },
            },
            {
                $project: {
                    _id: 0,
                    branchName: '$_id',
                    totalDeals: 1,
                    activeDeals: 1,
                    closedDeals: 1,
                    overdueDeals: 1,
                    totalVolume: 1,
                    totalExpected: 1,
                    totalRemaining: 1,
                    totalCollected: {
                        $ifNull: [{ $arrayElemAt: ['$paymentsData.totalCollected', 0] }, 0],
                    },
                },
            },
            { $sort: { totalVolume: -1 } },
        ]);
        return { branches };
    }
    async getMonthlyDynamics(orgId, monthsBack = 12) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
        const [dealsDynamics, paymentsDynamics, overdueDynamics, clientsDynamics] = await Promise.all([
            this.dealModel.aggregate([
                { $match: { organizationId, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        newDeals: { $sum: 1 },
                        volume: { $sum: '$salePrice' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
            this.paymentModel.aggregate([
                { $match: { organizationId, paymentDate: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$paymentDate' },
                            month: { $month: '$paymentDate' },
                        },
                        paymentsCount: { $sum: 1 },
                        collected: { $sum: '$amount' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
            this.overdueModel.aggregate([
                { $match: { organizationId, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        newOverdue: { $sum: 1 },
                        overdueAmount: { $sum: '$overdueAmount' },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
            this.clientModel.aggregate([
                { $match: { organizationId, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        newClients: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
        ]);
        const monthsMap = new Map();
        for (let i = 0; i < monthsBack; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1 + i, 1);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            monthsMap.set(key, {
                year: d.getFullYear(),
                month: d.getMonth() + 1,
                newDeals: 0,
                volume: 0,
                paymentsCount: 0,
                collected: 0,
                newOverdue: 0,
                overdueAmount: 0,
                newClients: 0,
            });
        }
        for (const item of dealsDynamics) {
            const key = `${item._id.year}-${item._id.month}`;
            const entry = monthsMap.get(key);
            if (entry) {
                entry.newDeals = item.newDeals;
                entry.volume = item.volume;
            }
        }
        for (const item of paymentsDynamics) {
            const key = `${item._id.year}-${item._id.month}`;
            const entry = monthsMap.get(key);
            if (entry) {
                entry.paymentsCount = item.paymentsCount;
                entry.collected = item.collected;
            }
        }
        for (const item of overdueDynamics) {
            const key = `${item._id.year}-${item._id.month}`;
            const entry = monthsMap.get(key);
            if (entry) {
                entry.newOverdue = item.newOverdue;
                entry.overdueAmount = item.overdueAmount;
            }
        }
        for (const item of clientsDynamics) {
            const key = `${item._id.year}-${item._id.month}`;
            const entry = monthsMap.get(key);
            if (entry) {
                entry.newClients = item.newClients;
            }
        }
        return { months: Array.from(monthsMap.values()) };
    }
    async getDownPaymentAnalysis(orgId) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const distribution = await this.dealModel.aggregate([
            { $match: { organizationId } },
            {
                $addFields: {
                    downPaymentPercent: {
                        $round: [
                            { $multiply: [{ $divide: ['$downPayment', '$salePrice'] }, 100] },
                            0,
                        ],
                    },
                },
            },
            {
                $bucket: {
                    groupBy: '$downPaymentPercent',
                    boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                    default: 100,
                    output: {
                        count: { $sum: 1 },
                        totalVolume: { $sum: '$salePrice' },
                        avgDownPayment: { $avg: '$downPayment' },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    rangeFrom: '$_id',
                    count: 1,
                    totalVolume: 1,
                    avgDownPayment: { $round: ['$avgDownPayment', 2] },
                },
            },
        ]);
        const summary = await this.dealModel.aggregate([
            { $match: { organizationId } },
            {
                $group: {
                    _id: null,
                    avgDownPaymentPercent: {
                        $avg: { $multiply: [{ $divide: ['$downPayment', '$salePrice'] }, 100] },
                    },
                    avgDownPaymentAmount: { $avg: '$downPayment' },
                    minDownPayment: { $min: '$downPayment' },
                    maxDownPayment: { $max: '$downPayment' },
                },
            },
        ]);
        return {
            avgDownPaymentPercent: Math.round((summary[0]?.avgDownPaymentPercent || 0) * 100) / 100,
            avgDownPaymentAmount: Math.round(summary[0]?.avgDownPaymentAmount || 0),
            minDownPayment: summary[0]?.minDownPayment || 0,
            maxDownPayment: summary[0]?.maxDownPayment || 0,
            distribution,
        };
    }
    async getTermDistribution(orgId) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const distribution = await this.dealModel.aggregate([
            { $match: { organizationId } },
            {
                $group: {
                    _id: '$termMonths',
                    count: { $sum: 1 },
                    totalVolume: { $sum: '$salePrice' },
                    avgMonthlyPayment: { $avg: '$monthlyPayment' },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    termMonths: '$_id',
                    count: 1,
                    totalVolume: 1,
                    avgMonthlyPayment: { $round: ['$avgMonthlyPayment', 2] },
                },
            },
        ]);
        const summary = await this.dealModel.aggregate([
            { $match: { organizationId } },
            {
                $group: {
                    _id: null,
                    avgTermMonths: { $avg: '$termMonths' },
                    minTermMonths: { $min: '$termMonths' },
                    maxTermMonths: { $max: '$termMonths' },
                },
            },
        ]);
        return {
            avgTermMonths: Math.round((summary[0]?.avgTermMonths || 0) * 100) / 100,
            minTermMonths: summary[0]?.minTermMonths || 0,
            maxTermMonths: summary[0]?.maxTermMonths || 0,
            distribution,
        };
    }
    async getCollectionEfficiency(orgId, dateFrom, dateTo) {
        const organizationId = new mongoose_2.Types.ObjectId(orgId);
        const now = new Date();
        const from = dateFrom ? new Date(dateFrom) : new Date(now.getFullYear(), 0, 1);
        const to = dateTo ? new Date(dateTo + 'T23:59:59.999Z') : now;
        const expectedPayments = await this.dealModel.aggregate([
            {
                $match: {
                    organizationId,
                    status: { $in: [deal_schema_1.DealStatus.ACTIVE, deal_schema_1.DealStatus.OVERDUE, deal_schema_1.DealStatus.CLOSED] },
                },
            },
            { $unwind: '$paymentSchedule' },
            {
                $match: {
                    'paymentSchedule.date': { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$paymentSchedule.date' },
                        month: { $month: '$paymentSchedule.date' },
                    },
                    expectedAmount: { $sum: '$paymentSchedule.amount' },
                    expectedCount: { $sum: 1 },
                    paidCount: {
                        $sum: {
                            $cond: [{ $eq: ['$paymentSchedule.status', 'paid'] }, 1, 0],
                        },
                    },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);
        const actualPayments = await this.paymentModel.aggregate([
            {
                $match: {
                    organizationId,
                    paymentDate: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$paymentDate' },
                        month: { $month: '$paymentDate' },
                    },
                    actualAmount: { $sum: '$amount' },
                    actualCount: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);
        const monthsMap = new Map();
        for (const item of expectedPayments) {
            const key = `${item._id.year}-${item._id.month}`;
            monthsMap.set(key, {
                year: item._id.year,
                month: item._id.month,
                expectedAmount: item.expectedAmount,
                expectedCount: item.expectedCount,
                paidOnScheduleCount: item.paidCount,
                actualAmount: 0,
                actualCount: 0,
                efficiency: 0,
            });
        }
        for (const item of actualPayments) {
            const key = `${item._id.year}-${item._id.month}`;
            const entry = monthsMap.get(key);
            if (entry) {
                entry.actualAmount = item.actualAmount;
                entry.actualCount = item.actualCount;
                entry.efficiency = entry.expectedAmount > 0
                    ? Math.round((item.actualAmount / entry.expectedAmount) * 10000) / 100
                    : 0;
            }
            else {
                monthsMap.set(key, {
                    year: item._id.year,
                    month: item._id.month,
                    expectedAmount: 0,
                    expectedCount: 0,
                    paidOnScheduleCount: 0,
                    actualAmount: item.actualAmount,
                    actualCount: item.actualCount,
                    efficiency: 0,
                });
            }
        }
        const monthly = Array.from(monthsMap.values()).sort((a, b) => a.year - b.year || a.month - b.month);
        const totalExpected = monthly.reduce((sum, m) => sum + m.expectedAmount, 0);
        const totalActual = monthly.reduce((sum, m) => sum + m.actualAmount, 0);
        const overallEfficiency = totalExpected > 0
            ? Math.round((totalActual / totalExpected) * 10000) / 100
            : 0;
        return {
            totalExpected,
            totalActual,
            overallEfficiency,
            monthly,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(deal_schema_1.Deal.name)),
    __param(1, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __param(2, (0, mongoose_1.InjectModel)(client_schema_1.Client.name)),
    __param(3, (0, mongoose_1.InjectModel)(overdue_schema_1.Overdue.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ReportsService);
//# sourceMappingURL=reports.service.js.map