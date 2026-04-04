export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_PARTNER = 'admin_partner',
  DIRECTOR = 'director',
  // Org-scoped roles (used by seed / CRM users)
  ORG_OWNER = 'org_owner',
  ORG_MANAGER = 'org_manager',
  ORG_EMPLOYEE = 'org_employee',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  ACCOUNTANT = 'accountant',
  SECURITY = 'security',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
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
