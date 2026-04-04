export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    ADMIN_PARTNER = "admin_partner",
    DIRECTOR = "director",
    ORG_OWNER = "org_owner",
    ORG_MANAGER = "org_manager",
    ORG_EMPLOYEE = "org_employee",
    MANAGER = "manager",
    CASHIER = "cashier",
    ACCOUNTANT = "accountant",
    SECURITY = "security"
}
export declare const ROLE_HIERARCHY: Record<UserRole, number>;
