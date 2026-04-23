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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto_1 = require("crypto");
const user_schema_1 = require("./schemas/user.schema");
const organization_schema_1 = require("../organizations/schemas/organization.schema");
let UsersService = class UsersService {
    constructor(userModel, organizationModel) {
        this.userModel = userModel;
        this.organizationModel = organizationModel;
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }
    async findByEmail(email) {
        return this.userModel
            .findOne({ email: email.toLowerCase().trim() })
            .select('+passwordHash +refreshToken')
            .exec();
    }
    async findAll(orgId, filters) {
        const query = {};
        if (orgId) {
            query.organizationId = new mongoose_2.Types.ObjectId(orgId);
        }
        if (filters?.role) {
            query.role = filters.role;
        }
        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        if (filters?.search) {
            const searchRegex = new RegExp(filters.search, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
            ];
        }
        const page = filters?.page ?? 1;
        const limit = filters?.limit ?? 20;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.userModel
                .find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec(),
            this.userModel.countDocuments(query).exec(),
        ]);
        return { users, total };
    }
    async create(dto) {
        const existingUser = await this.userModel
            .findOne({ email: dto.email.toLowerCase().trim() })
            .exec();
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const user = new this.userModel({
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
            organizationId: dto.organizationId
                ? new mongoose_2.Types.ObjectId(dto.organizationId)
                : undefined,
            isActive: true,
        });
        return user.save();
    }
    async update(id, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const updateData = {};
        if (dto.email) {
            const existing = await this.userModel
                .findOne({ email: dto.email.toLowerCase().trim(), _id: { $ne: id } })
                .exec();
            if (existing) {
                throw new common_1.ConflictException('Email already in use');
            }
            updateData.email = dto.email;
        }
        if (dto.password) {
            updateData.passwordHash = await bcrypt.hash(dto.password, 12);
        }
        if (dto.firstName)
            updateData.firstName = dto.firstName;
        if (dto.lastName)
            updateData.lastName = dto.lastName;
        if (dto.role)
            updateData.role = dto.role;
        if (dto.organizationId) {
            updateData.organizationId = new mongoose_2.Types.ObjectId(dto.organizationId);
        }
        if (dto.branchId !== undefined) {
            updateData.branchId = dto.branchId
                ? new mongoose_2.Types.ObjectId(dto.branchId)
                : null;
        }
        if (dto.phone !== undefined) {
            updateData.phone = dto.phone || null;
        }
        const user = await this.userModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }
    async deactivate(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel
            .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }
    async activate(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel
            .findByIdAndUpdate(id, { $set: { isActive: true } }, { new: true })
            .exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID "${id}" not found`);
        }
        return user;
    }
    async inviteUser(dto, invitedBy) {
        const existingUser = await this.userModel
            .findOne({ email: dto.email.toLowerCase().trim() })
            .exec();
        if (existingUser) {
            throw new common_1.ConflictException('User with this email already exists');
        }
        if (dto.branchId) {
            if (!dto.organizationId) {
                throw new common_1.BadRequestException('branchId requires organizationId');
            }
            const org = await this.organizationModel
                .findById(dto.organizationId)
                .exec();
            if (!org) {
                throw new common_1.NotFoundException('Organization not found');
            }
            const branchExists = org.branches.some((b) => b._id?.toString() === dto.branchId);
            if (!branchExists) {
                throw new common_1.BadRequestException('Branch not found in this organization');
            }
        }
        const tempPassword = (0, crypto_1.randomUUID)().slice(0, 12);
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        const user = new this.userModel({
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
            organizationId: dto.organizationId
                ? new mongoose_2.Types.ObjectId(dto.organizationId)
                : undefined,
            branchId: dto.branchId ? new mongoose_2.Types.ObjectId(dto.branchId) : undefined,
            phone: dto.phone ?? null,
            invitedBy: new mongoose_2.Types.ObjectId(invitedBy),
            isActive: true,
        });
        const savedUser = await user.save();
        return { user: savedUser, tempPassword };
    }
    async updateRefreshToken(userId, token) {
        const hashedToken = token ? await bcrypt.hash(token, 12) : null;
        await this.userModel
            .findByIdAndUpdate(userId, { $set: { refreshToken: hashedToken } })
            .exec();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map