import { Request } from 'express';
import { Types } from 'mongoose';
import { UserRole } from '../constants/roles';
import { SubscriptionTier } from '../constants/subscription';

export interface JwtPayloadUser {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
  orgId?: Types.ObjectId;
  organizationId?: Types.ObjectId;
  firstName: string;
  lastName: string;
  isActive: boolean;
  [key: string]: unknown;
}

export interface RequestOrg {
  _id: Types.ObjectId;
  name: string;
  subscriptionTier: SubscriptionTier;
  isActive: boolean;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayloadUser;
  org?: RequestOrg;
}
