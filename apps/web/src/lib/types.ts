export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  platformRole?: string | null;
  isEmailVerified: boolean;
  preferredLanguage?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  memberships?: MyMembership[];
}

export interface MembershipPermission {
  id: string;
  code: string;
  category: string;
  nameKey: string;
}

export interface MembershipRole {
  id: string;
  name: string;
  code?: string | null;
  isBuiltIn?: boolean;
  permissions: MembershipPermission[];
}

export interface MyMembership {
  status: string;
  title?: string | null;
  organization: {
    id: string;
    legalName: string;
    tradingName?: string | null;
    verificationLevel?: string;
    status?: string;
  };
  roles: MembershipRole[];
  permissions: string[];
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: Profile;
}

export interface MyOrgEntry {
  status: string;
  title?: string | null;
  organization: {
    id: string;
    legalName: string;
    tradingName?: string | null;
    businessType: string;
    country?: string | null;
    city?: string | null;
    verificationLevel?: string;
    status?: string;
    preferredLanguage?: string;
  };
}

export type ImplementationStatus = 'IMPLEMENTED' | 'PARTIAL' | 'NOT_IMPLEMENTED';

export interface CatalogFeature {
  id: string;
  code: string;
  nameKey: string;
  descriptionKey: string;
  category: string;
  billingType: string;
  implementationStatus: ImplementationStatus;
  isOperational: boolean;
}

export interface FeaturesPayload {
  active: CatalogFeature[];
  available: CatalogFeature[];
}

export interface RoleRef {
  id: string;
  name: string;
  code?: string | null;
}

export interface MemberRow {
  id: string;
  status: string;
  title?: string | null;
  joinedAt: string;
  user: { id: string; name: string; email: string; phone?: string | null };
  roleAssignments: Array<{ role: RoleRef }>;
}

export interface InvitationRow {
  id: string;
  email: string;
  name?: string | null;
  roleId?: string | null;
  branchIds: string[];
  departmentIds: string[];
  status: string;
  expiresAt: string;
  invitedAt: string;
}

export interface MembersPayload {
  members: MemberRow[];
  invitations: InvitationRow[];
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  city?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChartAccount {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  parentId?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: { id: string; code: string; name: string } | null;
  _count?: { transactions: number };
}

export interface FinanceTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'PAYMENT' | 'RECEIPT';
  accountId?: string | null;
  amount: string;
  currency: string;
  description: string;
  occurredAt: string;
  createdAt: string;
  account?: { id: string; code: string; name: string } | null;
}

export interface TransactionsPayload {
  items: FinanceTransaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FinanceSummary {
  currency: string;
  incoming: number;
  outgoing: number;
  net: number;
  transactionCount: number;
  accountCount: number;
  byType: Record<string, { count: number; amount: number }>;
  topAccounts: Array<{ accountId: string | null; code: string | null; name: string | null; amount: number }>;
}

export interface RoleRow {
  id: string;
  name: string;
  description?: string | null;
  isBuiltIn: boolean;
  createdAt: string;
  _count: { memberRoles: number };
  permissions: Array<{ permission: { code: string; category: string } }>;
}

export interface PermissionGroup {
  category: string;
  permissions: Array<{ code: string; nameKey: string; descriptionKey: string }>;
}

export interface OrganizationProfile {
  id: string;
  ownerUserId: string;
  legalName: string;
  tradingName?: string | null;
  registrationNumber?: string | null;
  tin?: string | null;
  businessType: string;
  industry?: string | null;
  yearEstablished?: number | null;
  description?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  verificationLevel: string;
  status: string;
  preferredLanguage?: string | null;
  createdAt: string;
  updatedAt: string;
}