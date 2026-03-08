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
var GuarantorsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuarantorsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const guarantor_schema_1 = require("./schemas/guarantor.schema");
const encryption_1 = require("../../common/utils/encryption");
let GuarantorsService = GuarantorsService_1 = class GuarantorsService {
    constructor(guarantorModel) {
        this.guarantorModel = guarantorModel;
        this.logger = new common_1.Logger(GuarantorsService_1.name);
    }
    async create(orgId, dto, userId) {
        const data = {
            ...dto,
            clientId: new mongoose_2.Types.ObjectId(dto.clientId),
            organizationId: orgId,
            createdBy: userId,
        };
        if (dto.passport) {
            data.passport = this.encryptPassport(dto.passport);
        }
        const guarantor = new this.guarantorModel(data);
        const saved = await guarantor.save();
        return this.decryptGuarantorPassport(saved.toObject());
    }
    async findAll(orgId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const filter = { organizationId: orgId };
        const [data, total] = await Promise.all([
            this.guarantorModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.guarantorModel.countDocuments(filter).exec(),
        ]);
        const decryptedData = data.map((g) => this.decryptGuarantorPassport(g));
        return {
            data: decryptedData,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(orgId, guarantorId) {
        if (!mongoose_2.Types.ObjectId.isValid(guarantorId)) {
            throw new common_1.BadRequestException('Invalid guarantor ID');
        }
        const guarantor = await this.guarantorModel
            .findOne({
            _id: new mongoose_2.Types.ObjectId(guarantorId),
            organizationId: orgId,
        })
            .lean()
            .exec();
        if (!guarantor) {
            throw new common_1.NotFoundException('Guarantor not found');
        }
        return this.decryptGuarantorPassport(guarantor);
    }
    async findByClientId(orgId, clientId) {
        if (!mongoose_2.Types.ObjectId.isValid(clientId)) {
            throw new common_1.BadRequestException('Invalid client ID');
        }
        const guarantors = await this.guarantorModel
            .find({
            organizationId: orgId,
            clientId: new mongoose_2.Types.ObjectId(clientId),
        })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return guarantors.map((g) => this.decryptGuarantorPassport(g));
    }
    async update(orgId, guarantorId, dto, userId) {
        if (!mongoose_2.Types.ObjectId.isValid(guarantorId)) {
            throw new common_1.BadRequestException('Invalid guarantor ID');
        }
        const updateData = { ...dto };
        if (dto.passport) {
            updateData.passport = this.encryptPassport(dto.passport);
        }
        const guarantor = await this.guarantorModel
            .findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(guarantorId),
            organizationId: orgId,
        }, { $set: updateData }, { new: true, runValidators: true })
            .lean()
            .exec();
        if (!guarantor) {
            throw new common_1.NotFoundException('Guarantor not found');
        }
        return this.decryptGuarantorPassport(guarantor);
    }
    async remove(orgId, guarantorId) {
        if (!mongoose_2.Types.ObjectId.isValid(guarantorId)) {
            throw new common_1.BadRequestException('Invalid guarantor ID');
        }
        const result = await this.guarantorModel
            .findOneAndDelete({
            _id: new mongoose_2.Types.ObjectId(guarantorId),
            organizationId: orgId,
        })
            .exec();
        if (!result) {
            throw new common_1.NotFoundException('Guarantor not found');
        }
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
    decryptGuarantorPassport(guarantor) {
        if (!guarantor || !guarantor.passport) {
            return guarantor;
        }
        const passport = { ...guarantor.passport };
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
            this.logger.error(`Failed to decrypt passport for guarantor ${guarantor._id}: ${error.message}`);
        }
        return { ...guarantor, passport };
    }
};
exports.GuarantorsService = GuarantorsService;
exports.GuarantorsService = GuarantorsService = GuarantorsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(guarantor_schema_1.Guarantor.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], GuarantorsService);
//# sourceMappingURL=guarantors.service.js.map