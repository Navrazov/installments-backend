export enum SubscriptionTier {
  BASIC = 'basic',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export type Feature =
  | 'dashboard_basic'
  | 'dashboard_advanced'
  | 'dashboard_full'
  | 'clients_basic'
  | 'clients_full'
  | 'deals_basic'
  | 'deals_full'
  | 'payments_basic'
  | 'payments_full'
  | 'overdue_basic'
  | 'overdue_advanced'
  | 'reports_basic'
  | 'reports_advanced'
  | 'reports_full'
  | 'exports_pdf'
  | 'exports_excel'
  | 'guarantors'
  | 'reputation_basic'
  | 'reputation_full'
  | 'calculator'
  | 'multi_branch'
  | 'audit_logs'
  | 'analytics_advanced';

const BASIC_FEATURES: Feature[] = [
  'dashboard_basic',
  'clients_basic',
  'deals_basic',
  'payments_basic',
  'overdue_basic',
  'reports_basic',
  'calculator',
];

const PRO_FEATURES: Feature[] = [
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

const PREMIUM_FEATURES: Feature[] = [
  ...PRO_FEATURES,
  'dashboard_full',
  'reports_full',
  'reputation_full',
  'multi_branch',
  'analytics_advanced',
];

export const FEATURE_MATRIX: Record<SubscriptionTier, Feature[]> = {
  [SubscriptionTier.BASIC]: BASIC_FEATURES,
  [SubscriptionTier.PRO]: PRO_FEATURES,
  [SubscriptionTier.PREMIUM]: PREMIUM_FEATURES,
};

export function tierHasFeature(
  tier: SubscriptionTier,
  feature: Feature,
): boolean {
  return FEATURE_MATRIX[tier]?.includes(feature) ?? false;
}
