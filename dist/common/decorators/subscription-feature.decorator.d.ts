import { Feature } from '../constants/subscription';
export declare const FEATURE_KEY = "required_feature";
export declare const RequireFeature: (...features: Feature[]) => import("@nestjs/common").CustomDecorator<string>;
