"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const subscription_feature_decorator_1 = require("../decorators/subscription-feature.decorator");
const subscription_1 = require("../constants/subscription");
let SubscriptionGuard = class SubscriptionGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredFeatures = this.reflector.getAllAndOverride(subscription_feature_decorator_1.FEATURE_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredFeatures || requiredFeatures.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const org = request.org;
        if (!org || !org.subscriptionTier) {
            throw new common_1.ForbiddenException('Organization subscription information not found');
        }
        const missingFeatures = requiredFeatures.filter((feature) => !(0, subscription_1.tierHasFeature)(org.subscriptionTier, feature));
        if (missingFeatures.length > 0) {
            throw new common_1.ForbiddenException(`Your subscription plan (${org.subscriptionTier}) does not include the following features: ${missingFeatures.join(', ')}. Please upgrade your plan.`);
        }
        return true;
    }
};
exports.SubscriptionGuard = SubscriptionGuard;
exports.SubscriptionGuard = SubscriptionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], SubscriptionGuard);
//# sourceMappingURL=subscription.guard.js.map