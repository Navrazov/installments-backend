import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/subscription-feature.decorator';
import { Feature, tierHasFeature } from '../constants/subscription';
import { AuthenticatedRequest } from '../interfaces/request.interface';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeatures = this.reflector.getAllAndOverride<Feature[]>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const org = request.org;

    if (!org || !org.subscriptionTier) {
      throw new ForbiddenException(
        'Organization subscription information not found',
      );
    }

    const missingFeatures = requiredFeatures.filter(
      (feature) => !tierHasFeature(org.subscriptionTier, feature),
    );

    if (missingFeatures.length > 0) {
      throw new ForbiddenException(
        `Your subscription plan (${org.subscriptionTier}) does not include the following features: ${missingFeatures.join(', ')}. Please upgrade your plan.`,
      );
    }

    return true;
  }
}
