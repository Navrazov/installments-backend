export declare enum SubscriptionTier {
    BASIC = "basic",
    PRO = "pro",
    PREMIUM = "premium"
}
export type Feature = 'dashboard_basic' | 'dashboard_advanced' | 'dashboard_full' | 'clients_basic' | 'clients_full' | 'deals_basic' | 'deals_full' | 'payments_basic' | 'payments_full' | 'overdue_basic' | 'overdue_advanced' | 'reports_basic' | 'reports_advanced' | 'reports_full' | 'exports_pdf' | 'exports_excel' | 'guarantors' | 'reputation_basic' | 'reputation_full' | 'calculator' | 'multi_branch' | 'analytics_advanced' | 'roles_management';
export declare const FEATURE_MATRIX: Record<SubscriptionTier, Feature[]>;
export declare function tierHasFeature(tier: SubscriptionTier, feature: Feature): boolean;
