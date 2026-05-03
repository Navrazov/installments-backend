import { SetMetadata } from '@nestjs/common';
import { Permission } from '../constants/permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Marks an endpoint as requiring at least one of the listed permissions.
 * Combine with `PermissionsGuard` (registered globally via JwtAuthGuard chain
 * or per-controller).
 */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
