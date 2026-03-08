export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_PARTNER = 'admin_partner',
  ORG_OWNER = 'org_owner',
  ORG_MANAGER = 'org_manager',
  ORG_EMPLOYEE = 'org_employee',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 50,
  [UserRole.ADMIN_PARTNER]: 40,
  [UserRole.ORG_OWNER]: 30,
  [UserRole.ORG_MANAGER]: 20,
  [UserRole.ORG_EMPLOYEE]: 10,
};
