import { UserRole } from './roles';

/**
 * Permissions enum — discrete actions a role can perform.
 *
 * Naming convention: `<RESOURCE>_<ACTION>`. Add new permissions here, then map them
 * to roles in `ROLE_PERMISSIONS` below. Endpoints declare requirements via the
 * `@Permissions(...)` decorator; `PermissionsGuard` enforces them.
 */
export enum Permission {
  // Clients
  CLIENTS_VIEW = 'clients:view',
  CLIENTS_CREATE = 'clients:create',
  CLIENTS_UPDATE = 'clients:update',
  CLIENTS_DELETE = 'clients:delete',
  CLIENTS_EXPORT = 'clients:export',
  CLIENTS_IMPORT = 'clients:import',
  CLIENTS_BLACKLIST = 'clients:blacklist',

  // Deals
  DEALS_VIEW = 'deals:view',
  DEALS_CREATE = 'deals:create',
  DEALS_UPDATE = 'deals:update',
  DEALS_DELETE = 'deals:delete',
  DEALS_CANCEL = 'deals:cancel',
  DEALS_CLOSE = 'deals:close',

  // Payments
  PAYMENTS_VIEW = 'payments:view',
  PAYMENTS_CREATE = 'payments:create',
  PAYMENTS_REFUND = 'payments:refund',

  // Organizations
  ORGS_VIEW = 'orgs:view',
  ORGS_UPDATE = 'orgs:update',
  ORGS_MANAGE_BRANCHES = 'orgs:manage_branches',
  ORGS_MANAGE_BILLING = 'orgs:manage_billing',
  ORGS_VIEW_STATS = 'orgs:view_stats',

  // Users
  USERS_VIEW = 'users:view',
  USERS_INVITE = 'users:invite',
  USERS_UPDATE = 'users:update',
  USERS_DEACTIVATE = 'users:deactivate',

  // Reports / analytics
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',

  // SMS
  SMS_VIEW = 'sms:view',
  SMS_SEND = 'sms:send',

  // Super-admin only
  PLATFORM_MANAGE_ORGS = 'platform:manage_orgs',
  PLATFORM_MANAGE_SUBSCRIPTIONS = 'platform:manage_subscriptions',
}

/**
 * Permissions granted to each role.
 *
 * To grant or revoke an action for a role, edit the array for that role —
 * no need to touch decorators or guards. Inheritance is explicit (no automatic
 * "higher role inherits lower"): each role lists what it can do.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Super admin gets every permission via the wildcard helper below; the array
    // is filled at the bottom of this file.
  ],

  [UserRole.ADMIN_PARTNER]: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_EXPORT,
    Permission.DEALS_VIEW,
    Permission.PAYMENTS_VIEW,
    Permission.ORGS_VIEW,
    Permission.ORGS_UPDATE,
    Permission.ORGS_MANAGE_BRANCHES,
    Permission.ORGS_VIEW_STATS,
    Permission.USERS_VIEW,
    Permission.USERS_INVITE,
    Permission.USERS_UPDATE,
    Permission.USERS_DEACTIVATE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.SMS_VIEW,
  ],

  [UserRole.DIRECTOR]: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_UPDATE,
    Permission.CLIENTS_DELETE,
    Permission.CLIENTS_EXPORT,
    Permission.CLIENTS_IMPORT,
    Permission.CLIENTS_BLACKLIST,
    Permission.DEALS_VIEW,
    Permission.DEALS_CREATE,
    Permission.DEALS_UPDATE,
    Permission.DEALS_DELETE,
    Permission.DEALS_CANCEL,
    Permission.DEALS_CLOSE,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.PAYMENTS_REFUND,
    Permission.ORGS_VIEW,
    Permission.ORGS_UPDATE,
    Permission.ORGS_MANAGE_BRANCHES,
    Permission.ORGS_VIEW_STATS,
    Permission.USERS_VIEW,
    Permission.USERS_INVITE,
    Permission.USERS_UPDATE,
    Permission.USERS_DEACTIVATE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.SMS_VIEW,
    Permission.SMS_SEND,
  ],

  [UserRole.ORG_OWNER]: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_UPDATE,
    Permission.CLIENTS_DELETE,
    Permission.CLIENTS_EXPORT,
    Permission.CLIENTS_IMPORT,
    Permission.CLIENTS_BLACKLIST,
    Permission.DEALS_VIEW,
    Permission.DEALS_CREATE,
    Permission.DEALS_UPDATE,
    Permission.DEALS_DELETE,
    Permission.DEALS_CANCEL,
    Permission.DEALS_CLOSE,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.PAYMENTS_REFUND,
    Permission.ORGS_VIEW,
    Permission.ORGS_UPDATE,
    Permission.ORGS_MANAGE_BRANCHES,
    Permission.ORGS_VIEW_STATS,
    Permission.USERS_VIEW,
    Permission.USERS_INVITE,
    Permission.USERS_UPDATE,
    Permission.USERS_DEACTIVATE,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
    Permission.SMS_VIEW,
    Permission.SMS_SEND,
  ],

  [UserRole.ORG_MANAGER]: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_UPDATE,
    Permission.CLIENTS_EXPORT,
    Permission.CLIENTS_IMPORT,
    Permission.CLIENTS_BLACKLIST,
    Permission.DEALS_VIEW,
    Permission.DEALS_CREATE,
    Permission.DEALS_UPDATE,
    Permission.DEALS_CANCEL,
    Permission.DEALS_CLOSE,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.ORGS_VIEW,
    Permission.ORGS_VIEW_STATS,
    Permission.USERS_VIEW,
    Permission.USERS_INVITE,
    Permission.REPORTS_VIEW,
    Permission.SMS_VIEW,
    Permission.SMS_SEND,
  ],

  [UserRole.MANAGER]: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_UPDATE,
    Permission.CLIENTS_EXPORT,
    Permission.CLIENTS_IMPORT,
    Permission.DEALS_VIEW,
    Permission.DEALS_CREATE,
    Permission.DEALS_UPDATE,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.ORGS_VIEW,
    Permission.ORGS_VIEW_STATS,
    Permission.USERS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.SMS_VIEW,
  ],

  [UserRole.ORG_EMPLOYEE]: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_CREATE,
    Permission.CLIENTS_UPDATE,
    Permission.DEALS_VIEW,
    Permission.DEALS_CREATE,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.ORGS_VIEW,
  ],

  [UserRole.CASHIER]: [
    Permission.CLIENTS_VIEW,
    Permission.DEALS_VIEW,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_CREATE,
    Permission.ORGS_VIEW,
  ],

  [UserRole.ACCOUNTANT]: [
    Permission.CLIENTS_VIEW,
    Permission.DEALS_VIEW,
    Permission.PAYMENTS_VIEW,
    Permission.PAYMENTS_REFUND,
    Permission.ORGS_VIEW,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_EXPORT,
  ],

  [UserRole.SECURITY]: [
    Permission.CLIENTS_VIEW,
    Permission.CLIENTS_BLACKLIST,
    Permission.DEALS_VIEW,
    Permission.PAYMENTS_VIEW,
    Permission.ORGS_VIEW,
  ],
};

// Super admin gets every permission — keep this in sync automatically.
ROLE_PERMISSIONS[UserRole.SUPER_ADMIN] = [
  ...Object.values(Permission),
  Permission.PLATFORM_MANAGE_ORGS,
  Permission.PLATFORM_MANAGE_SUBSCRIPTIONS,
];

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  if (permissions.length === 0) return true;
  return permissions.some((p) => roleHasPermission(role, p));
}
