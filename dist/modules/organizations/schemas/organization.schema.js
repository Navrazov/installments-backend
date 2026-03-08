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
exports.OrganizationSchema = exports.Organization = exports.OrganizationLimits = exports.OrganizationSettings = exports.OrganizationBranch = exports.SubscriptionStatus = exports.SubscriptionTier = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["BASIC"] = "basic";
    SubscriptionTier["PRO"] = "pro";
    SubscriptionTier["PREMIUM"] = "premium";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["SUSPENDED"] = "suspended";
    SubscriptionStatus["CANCELLED"] = "cancelled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
class OrganizationBranch {
}
exports.OrganizationBranch = OrganizationBranch;
class OrganizationSettings {
}
exports.OrganizationSettings = OrganizationSettings;
class OrganizationLimits {
}
exports.OrganizationLimits = OrganizationLimits;
let Organization = class Organization {
};
exports.Organization = Organization;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], Organization.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: SubscriptionTier,
        default: SubscriptionTier.BASIC,
    }),
    __metadata("design:type", String)
], Organization.prototype, "subscriptionTier", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE,
        index: true,
    }),
    __metadata("design:type", String)
], Organization.prototype, "subscriptionStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], Organization.prototype, "subscriptionExpiresAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Organization.prototype, "ownerId", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        currency: { type: String, default: 'RUB' },
        timezone: { type: String, default: 'Europe/Moscow' },
        language: { type: String, default: 'ru' },
    })),
    __metadata("design:type", OrganizationSettings)
], Organization.prototype, "settings", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        maxUsers: { type: Number, default: 5 },
        maxClients: { type: Number, default: 500 },
        maxDeals: { type: Number, default: 1000 },
    })),
    __metadata("design:type", OrganizationLimits)
], Organization.prototype, "limits", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                name: { type: String, required: true },
                address: { type: String, required: true },
                phone: { type: String, required: false },
                isActive: { type: Boolean, default: true },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Organization.prototype, "branches", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true, index: true }),
    __metadata("design:type", Boolean)
], Organization.prototype, "isActive", void 0);
exports.Organization = Organization = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'organizations' })
], Organization);
exports.OrganizationSchema = mongoose_1.SchemaFactory.createForClass(Organization);
exports.OrganizationSchema.index({ subscriptionStatus: 1, subscriptionExpiresAt: 1 });
//# sourceMappingURL=organization.schema.js.map