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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const organization_schema_1 = require("./schemas/organization.schema");
const subscription_1 = require("../../common/constants/subscription");
const TIER_LIMITS = {
    [organization_schema_1.SubscriptionTier.BASIC]: { maxUsers: 5, maxClients: 500, maxDeals: 1000 },
    [organization_schema_1.SubscriptionTier.PRO]: { maxUsers: 20, maxClients: 2000, maxDeals: 5000 },
    [organization_schema_1.SubscriptionTier.PREMIUM]: {
        maxUsers: 100,
        maxClients: 10000,
        maxDeals: 50000,
    },
};
let OrganizationsService = class OrganizationsService {
    constructor(orgModel) {
        this.orgModel = orgModel;
    }
    async create(dto) {
        const existingOrg = await this.orgModel
            .findOne({ slug: dto.slug.toLowerCase().trim() })
            .exec();
        if (existingOrg) {
            throw new common_1.ConflictException('Organization with this slug already exists');
        }
        const tier = dto.subscriptionTier ?? organization_schema_1.SubscriptionTier.BASIC;
        const org = new this.orgModel({
            name: dto.name,
            slug: dto.slug,
            ownerId: new mongoose_2.Types.ObjectId(dto.ownerId),
            subscriptionTier: tier,
            subscriptionStatus: organization_schema_1.SubscriptionStatus.ACTIVE,
            settings: dto.settings ?? {
                currency: 'RUB',
                timezone: 'Europe/Moscow',
                language: 'ru',
            },
            limits: TIER_LIMITS[tier],
            branches: [],
            isActive: true,
        });
        return org.save();
    }
    async findAll(filters) {
        const query = {};
        if (filters?.search) {
            const searchRegex = new RegExp(filters.search, 'i');
            query.$or = [{ name: searchRegex }, { slug: searchRegex }];
        }
        if (filters?.subscriptionTier) {
            query.subscriptionTier = filters.subscriptionTier;
        }
        if (filters?.subscriptionStatus) {
            query.subscriptionStatus = filters.subscriptionStatus;
        }
        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }
        const page = filters?.page ?? 1;
        const limit = filters?.limit ?? 20;
        const skip = (page - 1) * limit;
        const [organizations, total] = await Promise.all([
            this.orgModel
                .find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec(),
            this.orgModel.countDocuments(query).exec(),
        ]);
        return { organizations, total };
    }
    async findById(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid organization ID');
        }
        const org = await this.orgModel.findById(id).exec();
        if (!org) {
            throw new common_1.NotFoundException(`Organization with ID "${id}" not found`);
        }
        return org;
    }
    async update(id, dto) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid organization ID');
        }
        if (dto.slug) {
            const existing = await this.orgModel
                .findOne({ slug: dto.slug.toLowerCase().trim(), _id: { $ne: id } })
                .exec();
            if (existing) {
                throw new common_1.ConflictException('Slug already in use');
            }
        }
        const updateData = {};
        if (dto.name)
            updateData.name = dto.name;
        if (dto.slug)
            updateData.slug = dto.slug;
        if (dto.ownerId)
            updateData.ownerId = new mongoose_2.Types.ObjectId(dto.ownerId);
        if (dto.subscriptionTier)
            updateData.subscriptionTier = dto.subscriptionTier;
        if (dto.settings) {
            if (dto.settings.currency)
                updateData['settings.currency'] = dto.settings.currency;
            if (dto.settings.timezone)
                updateData['settings.timezone'] = dto.settings.timezone;
            if (dto.settings.language)
                updateData['settings.language'] = dto.settings.language;
        }
        const org = await this.orgModel
            .findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .exec();
        if (!org) {
            throw new common_1.NotFoundException(`Organization with ID "${id}" not found`);
        }
        return org;
    }
    async suspend(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid organization ID');
        }
        const org = await this.orgModel
            .findByIdAndUpdate(id, {
            $set: {
                subscriptionStatus: organization_schema_1.SubscriptionStatus.SUSPENDED,
                isActive: false,
            },
        }, { new: true })
            .exec();
        if (!org) {
            throw new common_1.NotFoundException(`Organization with ID "${id}" not found`);
        }
        return org;
    }
    async activate(id) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid organization ID');
        }
        const org = await this.orgModel
            .findByIdAndUpdate(id, {
            $set: {
                subscriptionStatus: organization_schema_1.SubscriptionStatus.ACTIVE,
                isActive: true,
            },
        }, { new: true })
            .exec();
        if (!org) {
            throw new common_1.NotFoundException(`Organization with ID "${id}" not found`);
        }
        return org;
    }
    async updateSubscription(id, tier) {
        if (!mongoose_2.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid organization ID');
        }
        const limits = TIER_LIMITS[tier];
        if (!limits) {
            throw new common_1.BadRequestException(`Invalid subscription tier: ${tier}`);
        }
        const org = await this.orgModel
            .findByIdAndUpdate(id, {
            $set: {
                subscriptionTier: tier,
                limits,
            },
        }, { new: true })
            .exec();
        if (!org) {
            throw new common_1.NotFoundException(`Organization with ID "${id}" not found`);
        }
        return org;
    }
    async addBranch(orgId, branchDto) {
        if (!mongoose_2.Types.ObjectId.isValid(orgId)) {
            throw new common_1.BadRequestException('Invalid organization ID');
        }
        const org = await this.orgModel.findById(orgId).exec();
        if (!org) {
            throw new common_1.NotFoundException(`Organization with ID "${orgId}" not found`);
        }
        if (org.branches.length >= 1) {
            const hasMultiBranch = (0, subscription_1.tierHasFeature)(org.subscriptionTier, 'multi_branch');
            if (!hasMultiBranch) {
                throw new common_1.BadRequestException('Multi-branch feature is not available for your subscription tier. Upgrade to Premium.');
            }
        }
        const updatedOrg = await this.orgModel
            .findByIdAndUpdate(orgId, {
            $push: {
                branches: {
                    name: branchDto.name,
                    address: branchDto.address,
                    phone: branchDto.phone ?? '',
                    isActive: true,
                },
            },
        }, { new: true })
            .exec();
        return updatedOrg;
    }
    async updateBranch(orgId, branchIndex, branchDto) {
        if (!mongoose_2.Types.ObjectId.isValid(orgId)) {
            throw new common_1.BadRequestException('Invalid organization ID');
        }
        const org = await this.orgModel.findById(orgId).exec();
        if (!org) {
            throw new common_1.NotFoundException(`Organization with ID "${orgId}" not found`);
        }
        if (branchIndex < 0 || branchIndex >= org.branches.length) {
            throw new common_1.BadRequestException(`Branch index ${branchIndex} is out of range`);
        }
        const updateFields = {};
        if (branchDto.name !== undefined) {
            updateFields[`branches.${branchIndex}.name`] = branchDto.name;
        }
        if (branchDto.address !== undefined) {
            updateFields[`branches.${branchIndex}.address`] = branchDto.address;
        }
        if (branchDto.phone !== undefined) {
            updateFields[`branches.${branchIndex}.phone`] = branchDto.phone;
        }
        const updatedOrg = await this.orgModel
            .findByIdAndUpdate(orgId, { $set: updateFields }, { new: true })
            .exec();
        return updatedOrg;
    }
    async removeBranch(orgId, branchIndex) {
        if (!mongoose_2.Types.ObjectId.isValid(orgId)) {
            throw new common_1.BadRequestException('Invalid organization ID');
        }
        const org = await this.orgModel.findById(orgId).exec();
        if (!org) {
            throw new common_1.NotFoundException(`Organization with ID "${orgId}" not found`);
        }
        if (branchIndex < 0 || branchIndex >= org.branches.length) {
            throw new common_1.BadRequestException(`Branch index ${branchIndex} is out of range`);
        }
        const updatedOrg = await this.orgModel
            .findByIdAndUpdate(orgId, { $set: { [`branches.${branchIndex}.isActive`]: false } }, { new: true })
            .exec();
        return updatedOrg;
    }
    async checkFeatureAccess(orgId, feature) {
        const org = await this.findById(orgId);
        if (org.subscriptionStatus !== organization_schema_1.SubscriptionStatus.ACTIVE ||
            !org.isActive) {
            return false;
        }
        return (0, subscription_1.tierHasFeature)(org.subscriptionTier, feature);
    }
    async getOrgStats(orgId) {
        const org = await this.findById(orgId);
        const activeBranches = org.branches.filter((b) => b.isActive).length;
        return {
            organization: org,
            activeBranches,
            totalBranches: org.branches.length,
        };
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(organization_schema_1.Organization.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map