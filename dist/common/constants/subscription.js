"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_MATRIX = exports.SubscriptionTier = void 0;
exports.tierHasFeature = tierHasFeature;
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["BASIC"] = "basic";
    SubscriptionTier["PRO"] = "pro";
    SubscriptionTier["PREMIUM"] = "premium";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
const BASIC_FEATURES = [
    'dashboard_basic',
    'clients_basic',
    'deals_basic',
    'payments_basic',
    'overdue_basic',
    'reports_basic',
    'calculator',
];
const PRO_FEATURES = [
    ...BASIC_FEATURES,
    'dashboard_advanced',
    'clients_full',
    'deals_full',
    'payments_full',
    'overdue_advanced',
    'reports_advanced',
    'exports_pdf',
    'exports_excel',
    'guarantors',
    'reputation_basic',
    'audit_logs',
];
const PREMIUM_FEATURES = [
    ...PRO_FEATURES,
    'dashboard_full',
    'reports_full',
    'reputation_full',
    'multi_branch',
    'analytics_advanced',
];
exports.FEATURE_MATRIX = {
    [SubscriptionTier.BASIC]: BASIC_FEATURES,
    [SubscriptionTier.PRO]: PRO_FEATURES,
    [SubscriptionTier.PREMIUM]: PREMIUM_FEATURES,
};
function tierHasFeature(tier, feature) {
    return exports.FEATURE_MATRIX[tier]?.includes(feature) ?? false;
}
//# sourceMappingURL=subscription.js.map