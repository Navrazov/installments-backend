"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const roles_1 = require("../constants/roles");
let OrgAccessGuard = class OrgAccessGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        if (user.role === roles_1.UserRole.SUPER_ADMIN ||
            user.role === roles_1.UserRole.ADMIN_PARTNER) {
            return true;
        }
        const orgId = request.params?.orgId ||
            request.query?.orgId ||
            request.body?.orgId ||
            request.headers['x-org-id'];
        if (!orgId) {
            return true;
        }
        if (!user.organizationId) {
            throw new common_1.ForbiddenException('User is not associated with any organization');
        }
        if (user.organizationId.toString() !== orgId.toString()) {
            throw new common_1.ForbiddenException('You do not have access to this organization\'s data');
        }
        return true;
    }
};
exports.OrgAccessGuard = OrgAccessGuard;
exports.OrgAccessGuard = OrgAccessGuard = __decorate([
    (0, common_1.Injectable)()
], OrgAccessGuard);
//# sourceMappingURL=org-access.guard.js.map