'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './language-switcher';
import { useSessionUser } from './use-session-user';
import { useMemberContext } from '@/lib/use-member-context';
import MobileMenuToggle from './mobile-menu-toggle';

export interface NavItem {
  href: string;
  label: string;
}

interface PermissionNavItem {
  href: string;
  labelKey: string;
  icon: string;
  permission?: string;
  platformOnly?: boolean;
  section?: string;
}

const PERMISSION_NAV: PermissionNavItem[] = [
  // Trade & Marketplace
  { href: '/products',   labelKey: 'products',  icon: '📦', permission: 'products.view', section: 'marketplace' },
  { href: '/rfqs',       labelKey: 'rfqs',       icon: '📋', permission: 'rfq.view',      section: 'marketplace' },
  { href: '/orders',     labelKey: 'orders',     icon: '🤝', permission: 'orders.view',   section: 'marketplace' },
  { href: '/messages',   labelKey: 'messages',   icon: '💬', permission: 'messages.view', section: 'marketplace' },
  // Logistics
  { href: '/logistics',  labelKey: 'logistics',  icon: '🚢', section: 'marketplace' },
  // Operations
  { href: '/marketing',  labelKey: 'marketing',  icon: '📣', section: 'operations' },
  { href: '/crm',        labelKey: 'crm',        icon: '📈', permission: 'crm.view',      section: 'operations' },
  { href: '/finance',    labelKey: 'finance',    icon: '📊', permission: 'finance.view',  section: 'operations' },
  // Billing & Wallet
  { href: '/wallet',     labelKey: 'wallet',     icon: '💳', permission: 'wallet.view',   section: 'account' },
  { href: '/billing',    labelKey: 'billing',    icon: '⭐', permission: 'billing.view',  section: 'account' },
  // Settings
  { href: '/team',       labelKey: 'team',       icon: '👥', permission: 'users.view',    section: 'settings' },
  { href: '/branches',   labelKey: 'branches',   icon: '🏢', permission: 'branches.view', section: 'settings' },
  { href: '/company-profile', labelKey: 'companyProfile', icon: '🏛️', permission: 'company.view', section: 'settings' },
  { href: '/features',   labelKey: 'features',   icon: '🔧', permission: 'features.view', section: 'settings' },
  // Platform Owner
  { href: '/admin/overview', labelKey: 'platformOverview', icon: '🛡️', platformOnly: true, section: 'platform' },
  { href: '/admin/revenue', labelKey: 'platformRevenue', icon: '🏦', platformOnly: true, section: 'platform' },
  { href: '/admin/users', labelKey: 'platformUsers', icon: '👥', platformOnly: true, section: 'platform' },
  { href: '/admin/organizations', labelKey: 'platformOrganizations', icon: '🏢', platformOnly: true, section: 'platform' },
  { href: '/admin/audit-logs', labelKey: 'platformAuditLogs', icon: '📋', platformOnly: true, section: 'platform' },
];

const SECTION_LABELS: Record<string, string> = {
  marketplace: 'Trade & Marketplace',
  operations: 'Operations',
  account: 'Account',
  settings: 'Settings',
  platform: 'Platform Admin',
};

function buildItems(
  nav: (key: string) => string,
  ctx: ReturnType<typeof useMemberContext>,
  isPlatformAdmin: boolean,
): { section: string; items: NavItem[] }[] {
  const sections: Map<string, NavItem[]> = new Map();

  // Dashboard always first
  const dashItems: NavItem[] = [{ href: '/dashboard', label: nav('dashboard') }];
  sections.set('main', dashItems);

  for (const item of PERMISSION_NAV) {
    // Skip platform-only items if user is not a platform admin
    if (item.platformOnly && !isPlatformAdmin) {
      continue;
    }
    
    const sec = item.section ?? 'settings';
    if (!sections.has(sec)) sections.set(sec, []);
    sections.get(sec)!.push({
      href: item.href,
      label: nav(item.labelKey),
    });
  }

  return Array.from(sections.entries()).map(([section, items]) => ({ section, items }));
}

function getRoleBadge(platformRole?: string | null, member?: any) {
  if (platformRole === 'PLATFORM_SUPER_ADMIN') return { label: 'Super Admin', cls: 'superadmin' };
  if (platformRole === 'PLATFORM_FINANCE_ADMIN') return { label: 'Finance Admin', cls: 'finance' };
  if (member) {
    const hasFinance = member.permissions?.includes('finance.view');
    const hasProducts = member.permissions?.includes('products.create');
    if (hasProducts) return { label: 'Seller', cls: 'seller' };
    if (hasFinance) return { label: 'Finance', cls: 'finance' };
    return { label: 'Buyer', cls: 'buyer' };
  }
  return null;
}

const NAV_ICONS: Record<string, string> = {
  '/dashboard': '🏠',
  '/products': '📦',
  '/rfqs': '📋',
  '/orders': '🤝',
  '/messages': '💬',
  '/logistics': '🚢',
  '/marketing': '📣',
  '/crm': '📈',
  '/finance': '📊',
  '/wallet': '💳',
  '/billing': '⭐',
  '/team': '👥',
  '/branches': '🏢',
  '/company-profile': '🏛️',
  '/features': '🔧',
  '/admin/overview': '🛡️',
  '/admin/revenue': '🏦',
  '/admin/users': '👥',
  '/admin/organizations': '🏢',
  '/admin/audit-logs': '📋',
};

export default function Shell({
  children,
  orgName,
  navItems,
}: {
  children: ReactNode;
  orgName?: string | null;
  navItems?: NavItem[];
}) {
  const t = useTranslations('common');
  const nav = useTranslations('nav');
  const pathname = usePathname();
  const user = useSessionUser();
  const ctx = useMemberContext();

  const isPlatformAdmin = Boolean(
    user?.platformRole === 'PLATFORM_SUPER_ADMIN' ||
      user?.platformRole === 'PLATFORM_FINANCE_ADMIN',
  );

  const roleBadge = getRoleBadge(user?.platformRole, ctx.membership);

  const grouped = navItems
    ? [{ section: 'main', items: navItems }]
    : buildItems(nav, ctx, isPlatformAdmin);

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const orgDisplayName = orgName ?? ctx.membership?.organization.legalName ?? '';

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo-area">
          <img
            src="/logo.png"
            alt={t('appName')}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* fallback text logo */}
          <span style={{ color: 'white', fontWeight: 800, fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em', display: 'none' }}>
            ETHIO-BRIDGE
          </span>
        </div>

        {grouped.map(({ section, items }) => (
          <div key={section}>
            {section !== 'main' && (
              <div className="sidebar-section-label">
                {SECTION_LABELS[section] ?? section}
              </div>
            )}
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const icon = NAV_ICONS[item.href] ?? '•';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link${active ? ' active' : ''}`}
                >
                  <span style={{ fontSize: 15 }}>{icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}

        <div className="sidebar-bottom">
          <LanguageSwitcher />
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          {/* Mobile Menu Toggle */}
          <MobileMenuToggle />

          {/* Global Search */}
          <div className="topbar-search">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search products, suppliers, RFQs..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value.trim();
                  if (q) window.location.href = `/products?search=${encodeURIComponent(q)}`;
                }
              }}
            />
          </div>

          <div className="topbar-right">
            {/* Quick action */}
            <Link href="/rfqs" className="btn btn-primary btn-sm" style={{ gap: 5 }}>
              + Post RFQ
            </Link>

            {/* Role Badge */}
            {roleBadge && (
              <span className={`role-badge ${roleBadge.cls}`}>
                {roleBadge.label}
              </span>
            )}

            {/* User */}
            <div className="topbar-user">
              <div className="user-avatar">{userInitials}</div>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.name ?? '—'}
                </div>
                {orgDisplayName && (
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {orgDisplayName}
                  </div>
                )}
              </div>
            </div>

            {/* Logout */}
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={() => {
                localStorage.removeItem('ehio.access');
                localStorage.removeItem('ehio.refresh');
                localStorage.removeItem('ehio.user');
                localStorage.removeItem('ehio.organizationId');
                window.location.href = '/';
              }}
            >
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="page-content" style={{ 
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
