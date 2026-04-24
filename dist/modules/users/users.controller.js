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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const invite_user_dto_1 = require("./dto/invite-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_1 = require("../../common/constants/roles");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async findAll(currentUser, role, isActive, search, page, limit) {
        const orgId = currentUser.organizationId
            ? currentUser.organizationId.toString()
            : undefined;
        const filters = {
            role,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
            search,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        };
        if (currentUser.role === roles_1.UserRole.SUPER_ADMIN) {
            return this.usersService.findAll(undefined, filters);
        }
        if (currentUser.role === roles_1.UserRole.ADMIN_PARTNER) {
            return this.usersService.findAll(undefined, filters);
        }
        return this.usersService.findAll(orgId, filters);
    }
    async findOne(id, currentUser) {
        const user = await this.usersService.findById(id);
        if (currentUser.role !== roles_1.UserRole.SUPER_ADMIN &&
            currentUser.role !== roles_1.UserRole.ADMIN_PARTNER &&
            currentUser.organizationId &&
            user.organizationId?.toString() !==
                currentUser.organizationId.toString()) {
            throw new common_1.ForbiddenException('You can only view users within your organization');
        }
        return user;
    }
    async invite(dto, currentUser) {
        this.validateInvitePermission(currentUser, dto.role);
        if (currentUser.role !== roles_1.UserRole.SUPER_ADMIN &&
            currentUser.role !== roles_1.UserRole.ADMIN_PARTNER) {
            if (!currentUser.organizationId) {
                throw new common_1.ForbiddenException('You must belong to an organization to invite users');
            }
            dto.organizationId = currentUser.organizationId.toString();
        }
        const result = await this.usersService.inviteUser(dto, currentUser._id.toString());
        return {
            user: result.user,
            tempPassword: result.tempPassword,
            message: 'User invited successfully. Provide the temporary password to the user.',
        };
    }
    async update(id, dto, currentUser) {
        const targetUser = await this.usersService.findById(id);
        if (currentUser.role !== roles_1.UserRole.SUPER_ADMIN &&
            currentUser.role !== roles_1.UserRole.ADMIN_PARTNER) {
            if (currentUser.organizationId &&
                targetUser.organizationId?.toString() !==
                    currentUser.organizationId.toString()) {
                throw new common_1.ForbiddenException('You can only update users within your organization');
            }
        }
        if (dto.role) {
            const currentHierarchy = roles_1.ROLE_HIERARCHY[currentUser.role] ?? 0;
            const targetHierarchy = roles_1.ROLE_HIERARCHY[dto.role] ?? 0;
            if (targetHierarchy >= currentHierarchy) {
                throw new common_1.ForbiddenException('You cannot assign a role equal to or higher than your own');
            }
        }
        return this.usersService.update(id, dto);
    }
    async deactivate(id, currentUser) {
        const targetUser = await this.usersService.findById(id);
        if (targetUser._id.toString() === currentUser._id.toString()) {
            throw new common_1.ForbiddenException('You cannot deactivate your own account');
        }
        if (currentUser.role !== roles_1.UserRole.SUPER_ADMIN &&
            currentUser.role !== roles_1.UserRole.ADMIN_PARTNER) {
            if (currentUser.organizationId &&
                targetUser.organizationId?.toString() !==
                    currentUser.organizationId.toString()) {
                throw new common_1.ForbiddenException('You can only deactivate users within your organization');
            }
        }
        const currentHierarchy = roles_1.ROLE_HIERARCHY[currentUser.role] ?? 0;
        const targetHierarchy = roles_1.ROLE_HIERARCHY[targetUser.role] ?? 0;
        if (targetHierarchy >= currentHierarchy) {
            throw new common_1.ForbiddenException('You cannot deactivate a user with an equal or higher role');
        }
        return this.usersService.deactivate(id);
    }
    validateInvitePermission(currentUser, targetRole) {
        const allowedRolesByInviter = {
            [roles_1.UserRole.SUPER_ADMIN]: [
                roles_1.UserRole.ADMIN_PARTNER,
                roles_1.UserRole.DIRECTOR,
                roles_1.UserRole.MANAGER,
                roles_1.UserRole.CASHIER,
                roles_1.UserRole.ACCOUNTANT,
                roles_1.UserRole.SECURITY,
            ],
            [roles_1.UserRole.ADMIN_PARTNER]: [
                roles_1.UserRole.DIRECTOR,
                roles_1.UserRole.MANAGER,
                roles_1.UserRole.CASHIER,
                roles_1.UserRole.ACCOUNTANT,
                roles_1.UserRole.SECURITY,
            ],
            [roles_1.UserRole.DIRECTOR]: [
                roles_1.UserRole.MANAGER,
                roles_1.UserRole.CASHIER,
                roles_1.UserRole.ACCOUNTANT,
                roles_1.UserRole.SECURITY,
            ],
            [roles_1.UserRole.ORG_OWNER]: [
                roles_1.UserRole.ORG_MANAGER,
                roles_1.UserRole.ORG_EMPLOYEE,
                roles_1.UserRole.MANAGER,
                roles_1.UserRole.CASHIER,
                roles_1.UserRole.ACCOUNTANT,
                roles_1.UserRole.SECURITY,
            ],
            [roles_1.UserRole.ORG_MANAGER]: [
                roles_1.UserRole.ORG_EMPLOYEE,
                roles_1.UserRole.CASHIER,
                roles_1.UserRole.ACCOUNTANT,
                roles_1.UserRole.SECURITY,
            ],
        };
        const allowed = allowedRolesByInviter[currentUser.role];
        if (!allowed || !allowed.includes(targetRole)) {
            throw new common_1.ForbiddenException(`You do not have permission to invite users with role "${targetRole}"`);
        }
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.MANAGER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('isActive')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.MANAGER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invite_user_dto_1.InviteUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "invite", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_1.UserRole.DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deactivate", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map