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
var ReputationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const warning_schema_1 = require("./schemas/warning.schema");
const client_schema_1 = require("../clients/schemas/client.schema");
let ReputationService = ReputationService_1 = class ReputationService {
    constructor(warningModel, clientModel) {
        this.warningModel = warningModel;
        this.clientModel = clientModel;
        this.logger = new common_1.Logger(ReputationService_1.name);
    }
    async addWarning(orgId, dto, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(dto.clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        const client = await this.clientModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(dto.clientId),
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        })
            .exec();
        if (!client) {
            throw new common_1.NotFoundException(`Client with ID "${dto.clientId}" not found`);
        }
        const warning = new this.warningModel({
            organizationId: new mongoose_2.Types.ObjectId(orgId),
            clientId: new mongoose_2.Types.ObjectId(dto.clientId),
            type: dto.type,
            severity: dto.severity,
            description: dto.description,
            evidence: dto.evidence || null,
            issuedBy: new mongoose_2.Types.ObjectId(userId),
            isActive: true,
        });
        const savedWarning = await warning.save();
        await this.clientModel
            .findByIdAndUpdate(dto.clientId, { $inc: { warningsCount: 1 } })
            .exec();
        const newRiskStatus = await this.calculateRiskStatus(dto.clientId);
        await this.clientModel
            .findByIdAndUpdate(dto.clientId, { $set: { riskStatus: newRiskStatus } })
            .exec();
        this.logger.log(`Warning added for client ${dto.clientId} by user ${userId}: type=${dto.type}, severity=${dto.severity}`);
        return savedWarning;
    }
    async findWarnings(orgId, clientId) {
        if (!mongoose_2.Types.ObjectId.isValid(clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        return this.warningModel
            .find({
            organizationId: new mongoose_2.Types.ObjectId(orgId),
            clientId: new mongoose_2.Types.ObjectId(clientId),
        })
            .populate('issuedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findAllWarnings(orgId, query) {
        const filter = {
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        };
        if (query.type) {
            filter.type = query.type;
        }
        if (query.severity) {
            filter.severity = query.severity;
        }
        if (query.isActive !== undefined) {
            filter.isActive = query.isActive;
        }
        if (query.clientId && mongoose_2.Types.ObjectId.isValid(query.clientId)) {
            filter.clientId = new mongoose_2.Types.ObjectId(query.clientId);
        }
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.warningModel
                .find(filter)
                .populate('clientId', 'firstName lastName phone')
                .populate('issuedBy', 'firstName lastName email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.warningModel.countDocuments(filter).exec(),
        ]);
        return { data, total, page, limit };
    }
    async deactivateWarning(orgId, warningId, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(warningId)) {
            throw new common_1.BadRequestException('Invalid warning ID');
        }
        const warning = await this.warningModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(warningId),
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        })
            .exec();
        if (!warning) {
            throw new common_1.NotFoundException(`Warning with ID "${warningId}" not found`);
        }
        if (!warning.isActive) {
            throw new common_1.BadRequestException('Warning is already deactivated');
        }
        warning.isActive = false;
        await warning.save();
        await this.clientModel
            .findByIdAndUpdate(warning.clientId, {
            $inc: { warningsCount: -1 },
        })
            .exec();
        await this.clientModel
            .updateOne({ _id: warning.clientId, warningsCount: { $lt: 0 } }, { $set: { warningsCount: 0 } })
            .exec();
        const newRiskStatus = await this.calculateRiskStatus(warning.clientId.toString());
        await this.clientModel
            .findByIdAndUpdate(warning.clientId, { $set: { riskStatus: newRiskStatus } })
            .exec();
        this.logger.log(`Warning ${warningId} deactivated by user ${userId}`);
        return warning;
    }
    async getClientReputationSummary(orgId, clientId) {
        if (!mongoose_2.Types.ObjectId.isValid(clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        const client = await this.clientModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(clientId),
            organizationId: new mongoose_2.Types.ObjectId(orgId),
        })
            .exec();
        if (!client) {
            throw new common_1.NotFoundException(`Client with ID "${clientId}" not found`);
        }
        const activeWarnings = await this.warningModel.countDocuments({
            organizationId: new mongoose_2.Types.ObjectId(orgId),
            clientId: new mongoose_2.Types.ObjectId(clientId),
            isActive: true,
        }).exec();
        return {
            warningsCount: client.warningsCount,
            activeWarnings,
            riskStatus: client.riskStatus,
            isBlacklisted: client.isBlacklisted,
        };
    }
    async calculateRiskStatus(clientId) {
        const activeWarnings = await this.warningModel
            .find({
            clientId: new mongoose_2.Types.ObjectId(clientId),
            isActive: true,
        })
            .exec();
        if (activeWarnings.length === 0) {
            return client_schema_1.RiskStatus.LOW;
        }
        const hasCritical = activeWarnings.some((w) => w.severity === warning_schema_1.WarningSeverity.CRITICAL);
        const hasWarning = activeWarnings.some((w) => w.severity === warning_schema_1.WarningSeverity.WARNING);
        if (hasCritical || activeWarnings.length >= 3) {
            return client_schema_1.RiskStatus.CRITICAL;
        }
        if (hasWarning) {
            return client_schema_1.RiskStatus.HIGH;
        }
        return client_schema_1.RiskStatus.MEDIUM;
    }
};
exports.ReputationService = ReputationService;
exports.ReputationService = ReputationService = ReputationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(warning_schema_1.Warning.name)),
    __param(1, (0, mongoose_1.InjectModel)(client_schema_1.Client.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], ReputationService);
//# sourceMappingURL=reputation.service.js.map