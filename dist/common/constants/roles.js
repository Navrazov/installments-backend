"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HIERARCHY = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["ADMIN_PARTNER"] = "admin_partner";
    UserRole["DIRECTOR"] = "director";
    UserRole["ORG_OWNER"] = "org_owner";
    UserRole["ORG_MANAGER"] = "org_manager";
    UserRole["ORG_EMPLOYEE"] = "org_employee";
    UserRole["MANAGER"] = "manager";
    UserRole["CASHIER"] = "cashier";
    UserRole["ACCOUNTANT"] = "accountant";
    UserRole["SECURITY"] = "security";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.ROLE_HIERARCHY = {
    [UserRole.SUPER_ADMIN]: 50,
    [UserRole.ADMIN_PARTNER]: 40,
    [UserRole.DIRECTOR]: 30,
    [UserRole.ORG_OWNER]: 30,
    [UserRole.ORG_MANAGER]: 20,
    [UserRole.MANAGER]: 20,
    [UserRole.ORG_EMPLOYEE]: 15,
    [UserRole.CASHIER]: 15,
    [UserRole.ACCOUNTANT]: 15,
    [UserRole.SECURITY]: 15,
};
//# sourceMappingURL=roles.js.map