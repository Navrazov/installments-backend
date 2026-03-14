export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_PARTNER = 'admin_partner',
  DIRECTOR = 'director',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  ACCOUNTANT = 'accountant',
  SECURITY = 'security',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 50,
  [UserRole.ADMIN_PARTNER]: 40,
  [UserRole.DIRECTOR]: 30,
  [UserRole.MANAGER]: 20,
  [UserRole.CASHIER]: 15,
  [UserRole.ACCOUNTANT]: 15,
  [UserRole.SECURITY]: 15,
};
