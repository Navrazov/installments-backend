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
var ClientsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const client_schema_1 = require("./schemas/client.schema");
const deal_schema_1 = require("../deals/schemas/deal.schema");
const payment_schema_1 = require("../payments/schemas/payment.schema");
const encryption_1 = require("../../common/utils/encryption");
let ClientsService = ClientsService_1 = class ClientsService {
    constructor(clientModel, dealModel, paymentModel) {
        this.clientModel = clientModel;
        this.dealModel = dealModel;
        this.paymentModel = paymentModel;
        this.logger = new common_1.Logger(ClientsService_1.name);
    }
    async create(orgId, dto, userId) {
        const data = {
            ...dto,
            organizationId: orgId,
            createdBy: userId,
        };
        if (dto.passport) {
            data.passport = this.encryptPassport(dto.passport);
        }
        const client = new this.clientModel(data);
        const saved = await client.save();
        return this.decryptClientPassport(saved.toObject());
    }
    async findAll(orgId, query) {
        const { page = 1, limit = 20, search, riskStatus, tags, isBlacklisted, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const filter = {
            organizationId: orgId,
        };
        if (search) {
            const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { phone: searchRegex },
                { middleName: searchRegex },
            ];
        }
        if (riskStatus) {
            filter.riskStatus = riskStatus;
        }
        if (tags && tags.length > 0) {
            filter.tags = { $all: tags };
        }
        if (isBlacklisted !== undefined) {
            filter.isBlacklisted = isBlacklisted;
        }
        const sort = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.clientModel
                .find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.clientModel.countDocuments(filter).exec(),
        ]);
        const decryptedData = data.map((client) => this.decryptClientPassport(client));
        return {
            data: decryptedData,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(orgId, clientId) {
        if (!mongoose_2.Types.ObjectId.isValid(clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        const client = await this.clientModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(clientId),
            organizationId: orgId,
        })
            .lean()
            .exec();
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        return this.decryptClientPassport(client);
    }
    async update(orgId, clientId, dto, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        const updateData = { ...dto };
        if (dto.passport) {
            updateData.passport = this.encryptPassport(dto.passport);
        }
        const client = await this.clientModel
            .findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(clientId),
            organizationId: orgId,
        }, { $set: updateData }, { new: true, runValidators: true })
            .lean()
            .exec();
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        return this.decryptClientPassport(client);
    }
    async addToBlacklist(orgId, clientId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        const client = await this.clientModel
            .findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(clientId),
            organizationId: orgId,
        }, {
            $set: {
                isBlacklisted: true,
                riskStatus: client_schema_1.RiskStatus.BLACKLISTED,
            },
        }, { new: true, runValidators: true })
            .lean()
            .exec();
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        return this.decryptClientPassport(client);
    }
    async removeFromBlacklist(orgId, clientId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        const client = await this.clientModel
            .findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(clientId),
            organizationId: orgId,
        }, {
            $set: {
                isBlacklisted: false,
                riskStatus: client_schema_1.RiskStatus.MEDIUM,
            },
        }, { new: true, runValidators: true })
            .lean()
            .exec();
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        return this.decryptClientPassport(client);
    }
    async updateRiskStatus(orgId, clientId, status, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        const updateData = { riskStatus: status };
        if (status === client_schema_1.RiskStatus.BLACKLISTED) {
            updateData.isBlacklisted = true;
        }
        const client = await this.clientModel
            .findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(clientId),
            organizationId: orgId,
        }, { $set: updateData }, { new: true, runValidators: true })
            .lean()
            .exec();
        if (!client) {
            throw new common_1.NotFoundException('Client not found');
        }
        return this.decryptClientPassport(client);
    }
    async getClientHistory(orgId, clientId) {
        const client = await this.findById(orgId, clientId);
        const clientObjId = new mongoose_2.Types.ObjectId(clientId);
        const [deals, payments] = await Promise.all([
            this.dealModel
                .find({
                organizationId: orgId,
                clientId: clientObjId,
            })
                .sort({ createdAt: -1 })
                .lean()
                .exec(),
            this.paymentModel
                .find({
                organizationId: orgId,
                clientId: clientObjId,
            })
                .sort({ createdAt: -1 })
                .lean()
                .exec(),
        ]);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const activeDeals = deals.filter((d) => d.status === 'active');
        const totalRemaining = activeDeals.reduce((sum, d) => sum + d.remainingAmount, 0);
        return {
            client,
            deals: deals,
            payments: payments,
            summary: {
                totalDeals: deals.length,
                activeDeals: activeDeals.length,
                totalPayments: payments.length,
                totalPaid,
                totalRemaining,
            },
        };
    }
    async search(orgId, query) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const clients = await this.clientModel
            .find({
            organizationId: orgId,
            $or: [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { middleName: searchRegex },
                { phone: searchRegex },
                { address: searchRegex },
                { city: searchRegex },
                { region: searchRegex },
            ],
        })
            .limit(20)
            .lean()
            .exec();
        return clients.map((c) => this.decryptClientPassport(c));
    }
    encryptPassport(passport) {
        const encrypted = {};
        if (passport.series) {
            encrypted.series = (0, encryption_1.encrypt)(passport.series);
        }
        if (passport.number) {
            encrypted.number = (0, encryption_1.encrypt)(passport.number);
        }
        if (passport.issuedBy) {
            encrypted.issuedBy = (0, encryption_1.encrypt)(passport.issuedBy);
        }
        if (passport.registrationAddress) {
            encrypted.registrationAddress = (0, encryption_1.encrypt)(passport.registrationAddress);
        }
        if (passport.issuedDate) {
            encrypted.issuedDate = passport.issuedDate;
        }
        return encrypted;
    }
    decryptClientPassport(client) {
        if (!client || !client.passport) {
            return client;
        }
        const passport = { ...client.passport };
        try {
            if (passport.series) {
                passport.series = (0, encryption_1.decrypt)(passport.series);
            }
            if (passport.number) {
                passport.number = (0, encryption_1.decrypt)(passport.number);
            }
            if (passport.issuedBy) {
                passport.issuedBy = (0, encryption_1.decrypt)(passport.issuedBy);
            }
            if (passport.registrationAddress) {
                passport.registrationAddress = (0, encryption_1.decrypt)(passport.registrationAddress);
            }
        }
        catch (error) {
            this.logger.error(`Failed to decrypt passport for client ${client._id}: ${error.message}`);
        }
        return { ...client, passport };
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = ClientsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(client_schema_1.Client.name)),
    __param(1, (0, mongoose_1.InjectModel)(deal_schema_1.Deal.name)),
    __param(2, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], ClientsService);
//# sourceMappingURL=clients.service.js.map