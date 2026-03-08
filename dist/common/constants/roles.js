"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HIERARCHY = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ADMIN_PARTNER"] = "admin_partner";
    UserRole["ORG_OWNER"] = "org_owner";
    UserRole["ORG_MANAGER"] = "org_manager";
    UserRole["ORG_EMPLOYEE"] = "org_employee";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.ROLE_HIERARCHY = {
    [UserRole.SUPER_ADMIN]: 50,
    [UserRole.ADMIN_PARTNER]: 40,
    [UserRole.ORG_OWNER]: 30,
    [UserRole.ORG_MANAGER]: 20,
    [UserRole.ORG_EMPLOYEE]: 10,
};
//# sourceMappingURL=roles.js.map