/**
 * Granular permissions (SDD §16). Codes are used directly in DB, decorators and guards.
 * Synthetic examples from the SDD are expanded into the full Phase-1/2/3 permission set.
 */

export const PermissionCategories = [
  'company',
  'users',
  'roles',
  'branches',
  'departments',
  'features',
  'finance',
  'ai',
  'audit',
  'billing',
  'products',
  'rfq',
  'messages',
  'orders',
  'crm',
  'wallet',
  'sales',
  'inventory',
  'procurement',
  'expenses',
  'lottery',
] as const;

export type PermissionCategory = (typeof PermissionCategories)[number];

export interface PermissionDef {
  code: string;
  category: PermissionCategory;
  nameKey: string; // i18n key: permission.<code>.name
  descriptionKey: string; // i18n key: permission.<code>.desc
  isActive?: boolean;
}

const def = (
  code: string,
  category: PermissionCategory,
): PermissionDef => ({
  code,
  category,
  nameKey: `permission.${code}.name`,
  descriptionKey: `permission.${code}.desc`,
});

export const PERMISSIONS: PermissionDef[] = [
  // company
  def('company.view', 'company'),
  def('company.edit', 'company'),
  // users
  def('users.view', 'users'),
  def('users.invite', 'users'),
  def('users.edit', 'users'),
  def('users.disable', 'users'),
  // roles
  def('roles.view', 'roles'),
  def('roles.manage', 'roles'),
  // branches
  def('branches.view', 'branches'),
  def('branches.manage', 'branches'),
  // departments
  def('departments.view', 'departments'),
  def('departments.manage', 'departments'),
  // features
  def('features.view', 'features'),
  def('features.request', 'features'),
  def('features.activate', 'features'),
  def('features.manage', 'features'),
  // finance (real slice implemented for the mandatory role test, SDD §167)
  def('finance.view', 'finance'),
  def('finance.create', 'finance'),
  def('finance.approve', 'finance'),
  def('finance.delete', 'finance'),
  // ai
  def('ai.use', 'ai'),
  def('ai.usage.view', 'ai'),
  // audit
  def('audit.view', 'audit'),
  def('audit.create', 'audit'),
  def('audit.finding.create', 'audit'),
  def('audit.finding.close', 'audit'),
  // billing & wallet
  def('billing.view', 'billing'),
  def('billing.manage', 'billing'),
  def('wallet.view', 'wallet'),
  def('wallet.transact', 'wallet'),
  // products
  def('products.view', 'products'),
  def('products.create', 'products'),
  def('products.edit', 'products'),
  def('products.delete', 'products'),
  def('products.publish', 'products'),
  // rfq
  def('rfq.view', 'rfq'),
  def('rfq.create', 'rfq'),
  def('rfq.respond', 'rfq'),
  def('rfq.manage', 'rfq'),
  // orders
  def('orders.view', 'orders'),
  def('orders.create', 'orders'),
  def('orders.manage', 'orders'),
  // messages
  def('messages.view', 'messages'),
  def('messages.send', 'messages'),
  // crm
  def('crm.view', 'crm'),
  def('crm.manage', 'crm'),
  // sales
  def('sales.view', 'sales'),
  def('sales.create', 'sales'),
  def('sales.manage', 'sales'),
  // inventory
  def('inventory.view', 'inventory'),
  def('inventory.manage', 'inventory'),
  // procurement
  def('procurement.view', 'procurement'),
  def('procurement.create', 'procurement'),
  def('procurement.manage', 'procurement'),
  // expenses
  def('expenses.view', 'expenses'),
  def('expenses.create', 'expenses'),
  def('expenses.manage', 'expenses'),
  // lottery
  def('lottery.view', 'lottery'),
  def('lottery.manage', 'lottery'),
  def('lottery.buy', 'lottery'),
];

export const PERMISSION_CODES = PERMISSIONS.map((p) => p.code);

export const ALL_PERMISSIONS: Record<string, boolean> = Object.fromEntries(
  PERMISSIONS.map((p) => [p.code, true]),
);

/**
 * Built-in organization role templates (SDD §15–17, §141).
 * Roles are seeded per organization when the organization is created; custom roles can be created later.
 */
export const BuiltInRoleCodes = {
  COMPANY_OWNER: 'COMPANY_OWNER',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  COMPANY_MANAGER: 'COMPANY_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  INTERNAL_AUDITOR: 'INTERNAL_AUDITOR',
  EXTERNAL_AUDITOR: 'EXTERNAL_AUDITOR',
} as const;

export type BuiltInRoleCode = (typeof BuiltInRoleCodes)[keyof typeof BuiltInRoleCodes];

export const BUILT_IN_ROLES: Record<BuiltInRoleCode, string[]> = {
  COMPANY_OWNER: PERMISSION_CODES, // every permission
  COMPANY_ADMIN: PERMISSION_CODES.filter((c) => c !== 'billing.manage'),
  COMPANY_MANAGER: [
    'company.view',
    'company.edit',
    'users.view',
    'roles.view',
    'branches.view',
    'branches.manage',
    'departments.view',
    'departments.manage',
    'features.view',
    'features.request',
    'finance.view',
    'finance.create',
    'products.view',
    'products.create',
    'products.edit',
    'rfq.view',
    'rfq.create',
    'rfq.respond',
    'orders.view',
    'orders.create',
    'messages.view',
    'messages.send',
    'crm.view',
    'crm.manage',
    'wallet.view',
    'ai.use',
    'ai.usage.view',
    'audit.view',
    'sales.view',
    'sales.create',
    'sales.manage',
    'inventory.view',
    'inventory.manage',
    'procurement.view',
    'procurement.create',
    'procurement.manage',
    'expenses.view',
    'expenses.create',
    'expenses.manage',
    'lottery.view',
    'lottery.manage',
  ],
  EMPLOYEE: [
    'company.view',
    'users.view',
    'branches.view',
    'departments.view',
    'finance.view',
    'products.view',
    'products.create',
    'rfq.view',
    'rfq.create',
    'orders.view',
    'messages.view',
    'messages.send',
    'crm.view',
    'sales.view',
    'sales.create',
    'inventory.view',
    'procurement.view',
    'procurement.create',
    'expenses.view',
    'expenses.create',
    'lottery.view',
    'lottery.buy',
  ],
  INTERNAL_AUDITOR: [
    'company.view',
    'audit.view',
    'audit.create',
    'audit.finding.create',
    'audit.finding.close',
    'finance.view',
    'ai.usage.view',
  ],
  EXTERNAL_AUDITOR: [
    'company.view',
    'audit.view',
    'audit.finding.create',
    'finance.view',
    'ai.usage.view',
  ],
};

/** Platform-side roles (SDD §5, §141). Stored on the user as a string column. */
export const PlatformRoleCodes = {
  PLATFORM_SUPER_ADMIN: 'PLATFORM_SUPER_ADMIN',
  PLATFORM_FINANCE_ADMIN: 'PLATFORM_FINANCE_ADMIN',
  PLATFORM_SUPPORT_ADMIN: 'PLATFORM_SUPPORT_ADMIN',
  PLATFORM_MODERATOR: 'PLATFORM_MODERATOR',
} as const;

export type PlatformRoleCode = (typeof PlatformRoleCodes)[keyof typeof PlatformRoleCodes];

export const PLATFORM_ROLES: string[] = Object.values(PlatformRoleCodes);