import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../constants/roles';
import { AuthenticatedRequest } from '../interfaces/request.interface';

@Injectable()
export class OrgAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admins and admin partners can access any organization
    if (
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ADMIN_PARTNER
    ) {
      return true;
    }

    // Extract orgId from route params, query, or body
    const orgId =
      request.params?.orgId ||
      request.query?.orgId ||
      request.body?.orgId ||
      request.headers['x-org-id'];

    // If no orgId is specified in the request, allow (the service layer
    // should scope queries to the user's own org)
    if (!orgId) {
      return true;
    }

    // Ensure the user belongs to the organization they are trying to access
    if (!user.orgId) {
      throw new ForbiddenException(
        'User is not associated with any organization',
      );
    }

    if (user.orgId.toString() !== orgId.toString()) {
      throw new ForbiddenException(
        'You do not have access to this organization\'s data',
      );
    }

    return true;
  }
}
