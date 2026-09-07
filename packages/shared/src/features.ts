/**
 * Feature catalog (SDD §20, §143).
 *
 * `implementationStatus`:
 *   - IMPLEMENTED  — fully working in this build, may appear operational once activated
 *   - PARTIAL      — a real backend slice exists, but the feature as a whole is NOT advertised as operational
 *   - NOT_IMPLEMENTED — must never appear operational (§143)
 */

export type FeatureCategory =
  | 'CORE'
  | 'B2B'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'AI'
  | 'AUDIT'
  | 'COMMERCE';

export type BillingType = 'FREE' | 'SUBSCRIPTION' | 'PAY_PER_USE' | 'ENTERPRISE';

export type FeatureImplementationStatus = 'IMPLEMENTED' | 'PARTIAL' | 'NOT_IMPLEMENTED';

export interface FeatureDef {
  code: string;
  nameKey: string;
  descriptionKey: string;
  category: FeatureCategory;
  billingType: BillingType;
  implementationStatus: FeatureImplementationStatus;
  /** When true, the feature may be shown as operational in the UI for entitled orgs. */
  isOperational: boolean;
  /** Optional default monthly usage limit for PAY_PER_USE features. */
  defaultUsageLimit?: number;
  sortOrder: number;
}

export const FEATURES: FeatureDef[] = [
  // --- CORE (Phase 1, implemented) ---
  {
    code: 'COMPANY_PROFILE',
    nameKey: 'feature.COMPANY_PROFILE.name',
    descriptionKey: 'feature.COMPANY_PROFILE.desc',
    category: 'CORE',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 1,
  },
  {
    code: 'USERS',
    nameKey: 'feature.USERS.name',
    descriptionKey: 'feature.USERS.desc',
    category: 'CORE',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 2,
  },
  {
    code: 'BRANCHES',
    nameKey: 'feature.BRANCHES.name',
    descriptionKey: 'feature.BRANCHES.desc',
    category: 'CORE',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 3,
  },
  {
    code: 'DEPARTMENTS',
    nameKey: 'feature.DEPARTMENTS.name',
    descriptionKey: 'feature.DEPARTMENTS.desc',
    category: 'CORE',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 4,
  },
  {
    code: 'NOTIFICATIONS',
    nameKey: 'feature.NOTIFICATIONS.name',
    descriptionKey: 'feature.NOTIFICATIONS.desc',
    category: 'CORE',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 5,
  },
  {
    code: 'FOUR_LANGUAGE_UI',
    nameKey: 'feature.FOUR_LANGUAGE_UI.name',
    descriptionKey: 'feature.FOUR_LANGUAGE_UI.desc',
    category: 'CORE',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 6,
  },

  // --- B2B MARKETPLACE & BRIDGE (Phase 2 & 3, implemented) ---
  {
    code: 'BUSINESS_HUB',
    nameKey: 'feature.BUSINESS_HUB.name',
    descriptionKey: 'feature.BUSINESS_HUB.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 10,
  },
  {
    code: 'PRODUCTS',
    nameKey: 'feature.PRODUCTS.name',
    descriptionKey: 'feature.PRODUCTS.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 11,
  },
  {
    code: 'SERVICES',
    nameKey: 'feature.SERVICES.name',
    descriptionKey: 'feature.SERVICES.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 12,
  },
  {
    code: 'BUSINESS_POSTS',
    nameKey: 'feature.BUSINESS_POSTS.name',
    descriptionKey: 'feature.BUSINESS_POSTS.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 13,
  },
  {
    code: 'CROSS_LANGUAGE_SEARCH',
    nameKey: 'feature.CROSS_LANGUAGE_SEARCH.name',
    descriptionKey: 'feature.CROSS_LANGUAGE_SEARCH.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 14,
  },
  {
    code: 'BUSINESS_CONNECTIONS',
    nameKey: 'feature.BUSINESS_CONNECTIONS.name',
    descriptionKey: 'feature.BUSINESS_CONNECTIONS.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 15,
  },
  {
    code: 'MESSAGING',
    nameKey: 'feature.MESSAGING.name',
    descriptionKey: 'feature.MESSAGING.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 16,
  },
  {
    code: 'RFQ',
    nameKey: 'feature.RFQ.name',
    descriptionKey: 'feature.RFQ.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 17,
  },
  {
    code: 'QUOTATION',
    nameKey: 'feature.QUOTATION.name',
    descriptionKey: 'feature.QUOTATION.desc',
    category: 'B2B',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 18,
  },
  {
    code: 'CRM',
    nameKey: 'feature.CRM.name',
    descriptionKey: 'feature.CRM.desc',
    category: 'B2B',
    billingType: 'SUBSCRIPTION',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 19,
  },

  // --- OPERATIONS (Phase 6) ---
  {
    code: 'SALES',
    nameKey: 'feature.SALES.name',
    descriptionKey: 'feature.SALES.desc',
    category: 'OPERATIONS',
    billingType: 'SUBSCRIPTION',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 20,
  },
  {
    code: 'INVENTORY',
    nameKey: 'feature.INVENTORY.name',
    descriptionKey: 'feature.INVENTORY.desc',
    category: 'OPERATIONS',
    billingType: 'SUBSCRIPTION',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 21,
  },
  {
    code: 'PROCUREMENT',
    nameKey: 'feature.PROCUREMENT.name',
    descriptionKey: 'feature.PROCUREMENT.desc',
    category: 'OPERATIONS',
    billingType: 'SUBSCRIPTION',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 22,
  },
  {
    code: 'EXPENSES',
    nameKey: 'feature.EXPENSES.name',
    descriptionKey: 'feature.EXPENSES.desc',
    category: 'OPERATIONS',
    billingType: 'SUBSCRIPTION',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 23,
  },

  // --- FINANCE ---
  {
    code: 'FINANCE',
    nameKey: 'feature.FINANCE.name',
    descriptionKey: 'feature.FINANCE.desc',
    category: 'FINANCE',
    billingType: 'SUBSCRIPTION',
    implementationStatus: 'PARTIAL',
    isOperational: true,
    sortOrder: 24,
  },

  // --- AI (Phase 5, implemented & pay-per-use) ---
  {
    code: 'AI_ASSISTANT',
    nameKey: 'feature.AI_ASSISTANT.name',
    descriptionKey: 'feature.AI_ASSISTANT.desc',
    category: 'AI',
    billingType: 'PAY_PER_USE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 30,
  },
  {
    code: 'AI_TRANSLATION',
    nameKey: 'feature.AI_TRANSLATION.name',
    descriptionKey: 'feature.AI_TRANSLATION.desc',
    category: 'AI',
    billingType: 'PAY_PER_USE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 31,
  },
  {
    code: 'AI_PRODUCT',
    nameKey: 'feature.AI_PRODUCT.name',
    descriptionKey: 'feature.AI_PRODUCT.desc',
    category: 'AI',
    billingType: 'PAY_PER_USE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 32,
  },
  {
    code: 'AI_MARKETING',
    nameKey: 'feature.AI_MARKETING.name',
    descriptionKey: 'feature.AI_MARKETING.desc',
    category: 'AI',
    billingType: 'PAY_PER_USE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 33,
  },
  {
    code: 'AI_DOCUMENT',
    nameKey: 'feature.AI_DOCUMENT.name',
    descriptionKey: 'feature.AI_DOCUMENT.desc',
    category: 'AI',
    billingType: 'PAY_PER_USE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 34,
  },
  {
    code: 'AI_MATCHING',
    nameKey: 'feature.AI_MATCHING.name',
    descriptionKey: 'feature.AI_MATCHING.desc',
    category: 'AI',
    billingType: 'PAY_PER_USE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 35,
  },
  {
    code: 'AI_MARKET_INTELLIGENCE',
    nameKey: 'feature.AI_MARKET_INTELLIGENCE.name',
    descriptionKey: 'feature.AI_MARKET_INTELLIGENCE.desc',
    category: 'AI',
    billingType: 'PAY_PER_USE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 36,
  },
  {
    code: 'AI_AUDIT',
    nameKey: 'feature.AI_AUDIT.name',
    descriptionKey: 'feature.AI_AUDIT.desc',
    category: 'AI',
    billingType: 'PAY_PER_USE',
    implementationStatus: 'PARTIAL',
    isOperational: false,
    sortOrder: 37,
  },

  // --- AUDIT (Phase 7, catalogued) ---
  {
    code: 'AUDIT',
    nameKey: 'feature.AUDIT.name',
    descriptionKey: 'feature.AUDIT.desc',
    category: 'AUDIT',
    billingType: 'SUBSCRIPTION',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 40,
  },
  {
    code: 'RISK_MANAGEMENT',
    nameKey: 'feature.RISK_MANAGEMENT.name',
    descriptionKey: 'feature.RISK_MANAGEMENT.desc',
    category: 'AUDIT',
    billingType: 'SUBSCRIPTION',
    implementationStatus: 'PARTIAL',
    isOperational: true,
    sortOrder: 41,
  },

  // --- COMMERCE / MONETIZATION ---
  {
    code: 'BILLING',
    nameKey: 'feature.BILLING.name',
    descriptionKey: 'feature.BILLING.desc',
    category: 'CORE',
    billingType: 'FREE',
    implementationStatus: 'IMPLEMENTED',
    isOperational: true,
    sortOrder: 50,
  },
];

export const FEATURE_CODES = FEATURES.map((f) => f.code);

export function getFeature(code: string): FeatureDef | undefined {
  return FEATURES.find((f) => f.code === code);
}