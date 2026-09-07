/**
 * Domain constants (SDD §10–19, §58, §66, §74, §101, §102).
 */

// Organization business types (SDD §11)
export const ORGANIZATION_BUSINESS_TYPES = [
  'PLC',
  'PRIVATE_COMPANY',
  'SOLE_PROPRIETORSHIP',
  'PARTNERSHIP',
  'COOPERATIVE',
  'NGO',
  'SME',
  'MANUFACTURER',
  'TRADER',
  'IMPORTER',
  'EXPORTER',
  'SERVICE_PROVIDER',
  'OTHER',
] as const;
export type OrganizationBusinessType = (typeof ORGANIZATION_BUSINESS_TYPES)[number];

// Verification levels (SDD §12). Must NOT imply government certification.
export const VERIFICATION_LEVELS = [
  'UNVERIFIED',
  'BASIC_VERIFIED',
  'BUSINESS_VERIFIED',
  'PREMIUM_VERIFIED',
  'SUSPENDED',
] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

export const ORGANIZATION_STATUSES = ['ACTIVE', 'SUSPENDED'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const MEMBER_STATUSES = ['INVITED', 'ACTIVE', 'DISABLED'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const ORGANIZATION_FEATURE_STATUSES = [
  'REQUESTED',
  'ACTIVE',
  'DISABLED',
  'EXPIRED',
  'SUSPENDED',
] as const;
export type OrganizationFeatureStatus = (typeof ORGANIZATION_FEATURE_STATUSES)[number];

export const FEATURE_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export type FeatureRequestStatus = (typeof FEATURE_REQUEST_STATUSES)[number];

export const FINANCE_TRANSACTION_TYPES = [
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'PAYMENT',
  'RECEIPT',
] as const;
export type FinanceTransactionType = (typeof FINANCE_TRANSACTION_TYPES)[number];

export const CHART_ACCOUNT_TYPES = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'INCOME',
  'EXPENSE',
] as const;
export type ChartAccountType = (typeof CHART_ACCOUNT_TYPES)[number];

// Tenant visibility (SDD §9)
export const VISIBILITY_LEVELS = ['PRIVATE', 'BUSINESS', 'PUBLIC'] as const;
export type VisibilityLevel = (typeof VISIBILITY_LEVELS)[number];

// Currency codes used across ETHIO-BRIDGE documents
export const CURRENCY_CODES = ['ETB', 'CNY', 'USD', 'EUR', 'GBP'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

// Product categories published to the marketplace (SDD §30)
export const PRODUCT_CATEGORIES = [
  'Agriculture & Livestock',
  'Agro-processing & Machinery',
  'Coffee & Beverages',
  'Ceramics & Glass',
  'Textiles, Garments & Leather',
  'Wood & Wood Products',
  'Metals & Steel Products',
  'Electronics & IT',
  'Electrical & Solar Energy',
  'Construction & Building Materials',
  'Machinery & Industrial Equipment',
  'Automotive & Spare Parts',
  'Chemicals & Plastics',
  'Pharmaceuticals & Healthcare',
  'Packaging & Paper',
  'Furniture & Home Appliances',
  'Food Processing & Staples',
  'Jewellery & Precious Metals',
  'Gifts, Handcrafts & Art',
  'Logistics, Transport & Services',
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// Origin markets commonly traded on ETHIO-BRIDGE (SDD §30, §61)
export const ORIGIN_COUNTRIES = [
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
] as const;

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * Sensitive actions recorded in the immutable audit log (SDD §58).
 */
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  FAILED_LOGIN: 'FAILED_LOGIN',
  REGISTER: 'REGISTER',
  LOGOUT: 'LOGOUT',
  CREATE_ORGANIZATION: 'CREATE_ORGANIZATION',
  EDIT_ORGANIZATION: 'EDIT_ORGANIZATION',
  INVITE_USER: 'INVITE_USER',
  JOIN_ORGANIZATION: 'JOIN_ORGANIZATION',
  DISABLE_USER: 'DISABLE_USER',
  ENABLE_USER: 'ENABLE_USER',
  CHANGE_ROLE: 'CHANGE_ROLE',
  CREATE_ROLE: 'CREATE_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',
  DELETE_ROLE: 'DELETE_ROLE',
  CREATE_BRANCH: 'CREATE_BRANCH',
  UPDATE_BRANCH: 'UPDATE_BRANCH',
  DELETE_BRANCH: 'DELETE_BRANCH',
  CREATE_DEPARTMENT: 'CREATE_DEPARTMENT',
  UPDATE_DEPARTMENT: 'UPDATE_DEPARTMENT',
  DELETE_DEPARTMENT: 'DELETE_DEPARTMENT',
  FEATURE_ACTIVATION: 'FEATURE_ACTIVATION',
  FEATURE_DEACTIVATION: 'FEATURE_DEACTIVATION',
  FEATURE_REQUEST: 'FEATURE_REQUEST',
  FEATURE_REQUEST_REVIEW: 'FEATURE_REQUEST_REVIEW',
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  CREATE_ACCOUNT: 'CREATE_ACCOUNT',
  UPDATE_ACCOUNT: 'UPDATE_ACCOUNT',
  AI_REQUEST: 'AI_REQUEST',
  EXPORT_DATA: 'EXPORT_DATA',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];