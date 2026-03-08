import { SetMetadata } from '@nestjs/common';
import { Feature } from '../constants/subscription';

export const FEATURE_KEY = 'required_feature';

export const RequireFeature = (...features: Feature[]) =>
  SetMetadata(FEATURE_KEY, features);
