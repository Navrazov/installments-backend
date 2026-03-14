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
exports.OrganizationsController = void 0;
const common_1 = require("@nestjs/common");
const organizations_service_1 = require("./organizations.service");
const create_organization_dto_1 = require("./dto/create-organization.dto");
const update_organization_dto_1 = require("./dto/update-organization.dto");
const create_organization_dto_2 = require("./dto/create-organization.dto");
const organization_schema_1 = require("./schemas/organization.schema");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_1 = require("../../common/constants/roles");
let OrganizationsController = class OrganizationsController {
    constructor(organizationsService) {
        this.organizationsService = organizationsService;
    }
    async create(dto) {
        return this.organizationsService.create(dto);
    }
    async findAll(currentUser, search, subscriptionTier, subscriptionStatus, isActive, page, limit) {
        if (currentUser.role !== roles_1.UserRole.SUPER_ADMIN &&
            currentUser.role !== roles_1.UserRole.ADMIN_PARTNER) {
            if (!currentUser.organizationId) {
                return { organizations: [], total: 0 };
            }
            const org = await this.organizationsService.findById(currentUser.organizationId.toString());
            return { organizations: [org], total: 1 };
        }
        return this.organizationsService.findAll({
            search,
            subscriptionTier,
            subscriptionStatus,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }
    async findOne(id, currentUser) {
        this.assertOrgAccess(currentUser, id);
        return this.organizationsService.findById(id);
    }
    async update(id, dto, currentUser) {
        this.assertOrgAccess(currentUser, id);
        return this.organizationsService.update(id, dto);
    }
    async suspend(id) {
        return this.organizationsService.suspend(id);
    }
    async activate(id) {
        return this.organizationsService.activate(id);
    }
    async updateSubscription(id, tier) {
        return this.organizationsService.updateSubscription(id, tier);
    }
    async addBranch(id, branchDto, currentUser) {
        this.assertOrgAccess(currentUser, id);
        return this.organizationsService.addBranch(id, branchDto);
    }
    async updateBranch(id, branchIndex, branchDto, currentUser) {
        this.assertOrgAccess(currentUser, id);
        return this.organizationsService.updateBranch(id, parseInt(branchIndex, 10), branchDto);
    }
    async removeBranch(id, branchIndex, currentUser) {
        this.assertOrgAccess(currentUser, id);
        return this.organizationsService.removeBranch(id, parseInt(branchIndex, 10));
    }
    async getStats(id, currentUser) {
        this.assertOrgAccess(currentUser, id);
        return this.organizationsService.getOrgStats(id);
    }
    async checkFeature(id, feature, currentUser) {
        this.assertOrgAccess(currentUser, id);
        const hasAccess = await this.organizationsService.checkFeatureAccess(id, feature);
        return { feature, hasAccess };
    }
    assertOrgAccess(currentUser, orgId) {
        if (currentUser.role === roles_1.UserRole.SUPER_ADMIN ||
            currentUser.role === roles_1.UserRole.ADMIN_PARTNER) {
            return;
        }
        if (!currentUser.organizationId ||
            currentUser.organizationId.toString() !== orgId) {
            throw new common_1.ForbiddenException('You can only access your own organization');
        }
    }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_organization_dto_1.CreateOrganizationDto]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.ADMIN_PARTNER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('subscriptionTier')),
    __param(3, (0, common_1.Query)('subscriptionStatus')),
    __param(4, (0, common_1.Query)('isActive')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.ADMIN_PARTNER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_organization_dto_1.UpdateOrganizationDto, Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/suspend'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "suspend", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/subscription'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('tier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "updateSubscription", null);
__decorate([
    (0, common_1.Post)(':id/branches'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_organization_dto_2.OrganizationBranchDto, Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "addBranch", null);
__decorate([
    (0, common_1.Patch)(':id/branches/:branchIndex'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('branchIndex')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "updateBranch", null);
__decorate([
    (0, common_1.Delete)(':id/branches/:branchIndex'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('branchIndex')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "removeBranch", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id/features/:feature'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.CASHIER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('feature')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "checkFeature", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, common_1.Controller)('organizations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map