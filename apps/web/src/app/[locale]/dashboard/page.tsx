'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { useErrorMessage } from '@/components/error-message';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getActiveOrganizationId, setActiveOrganizationId } from '@/lib/auth';
import { useSessionUser } from '@/components/use-session-user';
import { useMemberContext } from '@/lib/use-member-context';
import type { FeaturesPayload, MyOrgEntry } from '@/lib/types';

export default function DashboardPage() {
  const t = useTranslations();
  const dt = useTranslations('dash');
  const org = useTranslations('org');
  const cc = useTranslations('catalog');
  const message = useErrorMessage();
  const catalogCode = (nameKey: string): string => {
    const match = /^feature\.(.+)\.name$/.exec(nameKey);
    return match ? match[1] : nameKey;
  };
  const [orgEntry, setOrgEntry] = useState<MyOrgEntry | null>(null);
  const [features, setFeatures] = useState<FeaturesPayload | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [branchCount, setBranchCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [previewRole, setPreviewRole] = useState<
    '' | 'owner' | 'seller' | 'buyer' | 'finance' | 'member' | 'all'
  >('');
  const user = useSessionUser();
  const memberContext = useMemberContext();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const orgs = await api<MyOrgEntry[]>('/organizations/me');
        const stored = getActiveOrganizationId();
        const entry =
          orgs.find((o) => o.organization.id === stored && o.status === 'ACTIVE') ??
          orgs.find((o) => o.status === 'ACTIVE') ??
          orgs[0] ??
          null;
        if (cancelled) return;
        if (!entry) {
          setOrgEntry(null);
          return;
        }
        if (entry.organization.id !== stored) {
          setActiveOrganizationId(entry.organization.id);
        }
        setOrgEntry(entry);

        const [feats, memberCount, branchCount] = await Promise.all([
          api<FeaturesPayload>('/organizations/me/features').catch(() => null),
          api<{ members: unknown[] }>('/users')
            .then((u) => u.members.length)
            .catch(() => null),
          api<unknown[]>('/branches')
            .then((b) => b.length)
            .catch(() => null),
        ]);
        if (cancelled) return;
        setFeatures(feats);
        setMemberCount(memberCount);
        setBranchCount(branchCount);
      } catch (err) {
        if (!cancelled) setError(message(err));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const planned = features
    ? features.available.filter((f) => f.implementationStatus === 'NOT_IMPLEMENTED')
    : [];
  const workspace = features
    ? features.available.filter((f) => f.implementationStatus !== 'NOT_IMPLEMENTED')
    : [];

  // Determine user role based on permissions
  const getUserRole = () => {
    if (!memberContext.membership) return 'guest';
    
    const permissions = memberContext.membership.permissions || [];
    
    // Owner has full management control
    if (permissions.includes('roles.manage') || 
        permissions.includes('company.edit') ||
        permissions.includes('users.invite')) {
      return 'owner';
    }
    
    // Seller has product-related permissions
    if (permissions.includes('products.create') || 
        permissions.includes('products.manage')) {
      return 'seller';
    }
    
    // Buyer has order/RFQ related permissions
    if (permissions.includes('orders.create') || 
        permissions.includes('rfq.create')) {
      return 'buyer';
    }
    
    // Finance role
    if (permissions.includes('finance.view') || 
        permissions.includes('billing.view')) {
      return 'finance';
    }
    
    return 'member';
  };

  const userRole = getUserRole();
  const effectiveRole =
    previewRole === 'all'
      ? userRole
      : previewRole !== ''
        ? previewRole
        : userRole;

  const previews: Array<'owner' | 'seller' | 'buyer' | 'finance' | 'member'> = [
    'owner',
    'seller',
    'buyer',
    'finance',
    'member',
  ];
  const previewLabel = (r: string) =>
    r === 'owner'
      ? '🏢 Owner'
      : r === 'seller'
        ? '🏪 Seller'
        : r === 'buyer'
          ? '🛒 Buyer'
          : r === 'finance'
            ? '💼 Finance'
            : '👤 Member';

  // Role-specific dashboard content
  const renderDashboard = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <>
            {/* Owner Dashboard - Full Control */}
            <div className="kpi-grid">
              <Link href="/team" className="kpi-card" style={{ '--kpi-accent': 'var(--color-primary)', '--kpi-bg': 'var(--color-primary-light)', '--kpi-color': 'var(--color-primary)' } as React.CSSProperties}>
              <div className="kpi-icon">👥</div>
              <div className="kpi-label">{dt('memberCount')}</div>
              <div className="kpi-value">{memberCount ?? '…'}</div>
              <div className="kpi-sub">Team Members</div>
            </Link>
            <Link href="/branches" className="kpi-card" style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-light)', '--kpi-color': 'var(--color-success)' } as React.CSSProperties}>
              <div className="kpi-icon">🏢</div>
              <div className="kpi-label">{dt('branchCount')}</div>
              <div className="kpi-value">{branchCount ?? '…'}</div>
              <div className="kpi-sub">Locations</div>
            </Link>
            <Link href="/finance" className="kpi-card" style={{ '--kpi-accent': 'var(--color-warning)', '--kpi-bg': 'var(--color-warning-light)', '--kpi-color': 'var(--color-warning)' } as React.CSSProperties}>
              <div className="kpi-icon">💰</div>
              <div className="kpi-label">Revenue</div>
              <div className="kpi-value">{features?.active.length || 0}</div>
              <div className="kpi-sub">Active Features</div>
            </Link>
            <Link href="/products" className="kpi-card" style={{ '--kpi-accent': 'var(--color-info)', '--kpi-bg': 'var(--color-info-light)', '--kpi-color': 'var(--color-info)' } as React.CSSProperties}>
              <div className="kpi-icon">📦</div>
              <div className="kpi-label">Products</div>
              <div className="kpi-value">{workspace.length}</div>
              <div className="kpi-sub">Available Features</div>
            </Link>
          </div>

          <div className="card card-glass">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>🏢 Owner Overview</h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div className="detail-panel">
                <div className="detail-heading">Pending Approvals</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-warning)' }}>12</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Requires attention</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Active Orders</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>34</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>In progress</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Team Performance</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>94%</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Efficiency rate</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">System Health</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>✓</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>All systems operational</div>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 24 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>📈 Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>New order received</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>2 minutes ago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-info)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Team member joined</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>1 hour ago</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Payment received</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>3 hours ago</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>🎯 Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/team" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>👥</span> Manage Team
                </Link>
                <Link href="/products/create" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📦</span> Add Product
                </Link>
                <Link href="/rfqs" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📋</span> View RFQs
                </Link>
                <Link href="/finance" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>💰</span> Financial Reports
                </Link>
                <Link href="/settings" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>⚙️</span> System Settings
                </Link>
              </div>
            </div>
          </div>
          </>
        );

      case 'seller':
        return (
          <>
            {/* Seller Dashboard - Product & Order Focus */}
            <div className="kpi-grid">
              <Link href="/products" className="kpi-card" style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-light)', '--kpi-color': 'var(--color-success)' } as React.CSSProperties}>
              <div className="kpi-icon">📦</div>
              <div className="kpi-label">My Products</div>
              <div className="kpi-value">24</div>
              <div className="kpi-sub">Active listings</div>
            </Link>
            <Link href="/orders" className="kpi-card" style={{ '--kpi-accent': 'var(--color-primary)', '--kpi-bg': 'var(--color-primary-light)', '--kpi-color': 'var(--color-primary)' } as React.CSSProperties}>
              <div className="kpi-icon">🤝</div>
              <div className="kpi-label">Orders</div>
              <div className="kpi-value">18</div>
              <div className="kpi-sub">To fulfill</div>
            </Link>
            <Link href="/rfqs" className="kpi-card" style={{ '--kpi-accent': 'var(--color-warning)', '--kpi-bg': 'var(--color-warning-light)', '--kpi-color': 'var(--color-warning)' } as React.CSSProperties}>
              <div className="kpi-icon">📋</div>
              <div className="kpi-label">RFQs</div>
              <div className="kpi-value">7</div>
              <div className="kpi-sub">New requests</div>
            </Link>
            <Link href="/wallet" className="kpi-card" style={{ '--kpi-accent': 'var(--color-info)', '--kpi-bg': 'var(--color-info-light)', '--kpi-color': 'var(--color-info)' } as React.CSSProperties}>
              <div className="kpi-icon">💳</div>
              <div className="kpi-label">Earnings</div>
              <div className="kpi-value">$8,450</div>
              <div className="kpi-sub">This month</div>
            </Link>
          </div>

          <div className="card card-glass">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>🏪 Seller Overview</h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="detail-panel">
                <div className="detail-heading">Orders to Ship</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-warning)' }}>5</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Action required</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Product Views</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>1.2K</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>This week</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Response Rate</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>98%</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Customer satisfaction</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Rating</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-warning)' }}>4.8</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Out of 5 stars</div>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 24 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>📦 Top Products</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>☕</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Ethiopian Coffee</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>45 orders this month</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>$12,450</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>🌾</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Organic Teff</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>32 orders this month</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>$8,200</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>🫒</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Extra Virgin Oil</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>28 orders this month</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>$6,800</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>🎯 Seller Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/products/create" className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>➕</span> Add New Product
                </Link>
                <Link href="/orders" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📦</span> Manage Orders
                </Link>
                <Link href="/rfqs" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📋</span> Respond to RFQs
                </Link>
                <Link href="/messages" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>💬</span> Customer Messages
                </Link>
                <Link href="/wallet" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>💳</span> View Earnings
                </Link>
              </div>
            </div>
          </div>
          </>
        );

      case 'buyer':
        return (
          <>
            {/* Buyer Dashboard - Sourcing & Procurement Focus */}
            <div className="kpi-grid">
              <Link href="/rfqs" className="kpi-card" style={{ '--kpi-accent': 'var(--color-primary)', '--kpi-bg': 'var(--color-primary-light)', '--kpi-color': 'var(--color-primary)' } as React.CSSProperties}>
              <div className="kpi-icon">📋</div>
              <div className="kpi-label">Active RFQs</div>
              <div className="kpi-value">8</div>
              <div className="kpi-sub">Pending quotes</div>
            </Link>
            <Link href="/orders" className="kpi-card" style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-light)', '--kpi-color': 'var(--color-success)' } as React.CSSProperties}>
              <div className="kpi-icon">🤝</div>
              <div className="kpi-label">Orders</div>
              <div className="kpi-value">12</div>
              <div className="kpi-sub">In progress</div>
            </Link>
            <Link href="/logistics" className="kpi-card" style={{ '--kpi-accent': 'var(--color-info)', '--kpi-bg': 'var(--color-info-light)', '--kpi-color': 'var(--color-info)' } as React.CSSProperties}>
              <div className="kpi-icon">🚢</div>
              <div className="kpi-label">Shipments</div>
              <div className="kpi-value">3</div>
              <div className="kpi-sub">In transit</div>
            </Link>
            <Link href="/wallet" className="kpi-card" style={{ '--kpi-accent': 'var(--color-warning)', '--kpi-bg': 'var(--color-warning-light)', '--kpi-color': 'var(--color-warning)' } as React.CSSProperties}>
              <div className="kpi-icon">💳</div>
              <div className="kpi-label">Budget</div>
              <div className="kpi-value">$45K</div>
              <div className="kpi-sub">Remaining</div>
            </Link>
          </div>

          <div className="card card-glass">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>🛒 Buyer Overview</h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="detail-panel">
                <div className="detail-heading">Quotes Received</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>24</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>This week</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Avg. Response Time</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>2.4h</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Supplier speed</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Cost Savings</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>12%</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Vs. market price</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Suppliers</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-info)' }}>18</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Active partners</div>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 24 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>🔥 Hot Deals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>☕</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Premium Coffee Bulk</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>500kg available</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>-15%</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>🌾</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Organic Grains</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>2 tons available</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>-20%</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>🫒</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Cold Press Oil</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>1000L available</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>-10%</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>🎯 Buyer Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/rfqs" className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📋</span> Create RFQ
                </Link>
                <Link href="/products" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>🔍</span> Browse Products
                </Link>
                <Link href="/orders" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>🤝</span> Track Orders
                </Link>
                <Link href="/logistics" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>🚢</span> View Shipments
                </Link>
                <Link href="/messages" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>💬</span> Supplier Messages
                </Link>
              </div>
            </div>
          </div>
          </>
        );

      case 'finance':
        return (
          <>
            {/* Finance Dashboard - Financial Management */}
            <div className="kpi-grid">
              <Link href="/finance" className="kpi-card" style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-light)', '--kpi-color': 'var(--color-success)' } as React.CSSProperties}>
              <div className="kpi-icon">💰</div>
              <div className="kpi-label">Revenue</div>
              <div className="kpi-value">$284.5K</div>
              <div className="kpi-sub">This month</div>
            </Link>
            <Link href="/wallet" className="kpi-card" style={{ '--kpi-accent': 'var(--color-primary)', '--kpi-bg': 'var(--color-primary-light)', '--kpi-color': 'var(--color-primary)' } as React.CSSProperties}>
              <div className="kpi-icon">💳</div>
              <div className="kpi-label">Wallet Balance</div>
              <div className="kpi-value">$45,230</div>
              <div className="kpi-sub">Available</div>
            </Link>
            <Link href="/billing" className="kpi-card" style={{ '--kpi-accent': 'var(--color-warning)', '--kpi-bg': 'var(--color-warning-light)', '--kpi-color': 'var(--color-warning)' } as React.CSSProperties}>
              <div className="kpi-icon">📊</div>
              <div className="kpi-label">Pending</div>
              <div className="kpi-value">$12,450</div>
              <div className="kpi-sub">Invoices</div>
            </Link>
            <Link href="/transactions" className="kpi-card" style={{ '--kpi-accent': 'var(--color-info)', '--kpi-bg': 'var(--color-info-light)', '--kpi-color': 'var(--color-info)' } as React.CSSProperties}>
              <div className="kpi-icon">📈</div>
              <div className="kpi-label">Growth</div>
              <div className="kpi-value">+18%</div>
              <div className="kpi-sub">Vs last month</div>
            </Link>
          </div>

          <div className="card card-glass">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>💼 Finance Overview</h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="detail-panel">
                <div className="detail-heading">Daily Revenue</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>$9,483</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Average</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Expenses</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-danger)' }}>$45,200</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>This month</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Profit Margin</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>34%</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Net profit</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Cash Flow</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>Positive</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Healthy status</div>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginTop: 24 }}>
            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>📊 Recent Transactions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>💰</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Payment Received</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>From Coffee Export Co.</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>+$4,500</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>📤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Invoice Paid</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>To Shipping Partner</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-danger)' }}>-$1,200</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, background: 'var(--color-surface-2)', borderRadius: 8 }}>
                  <div style={{ fontSize: 20 }}>💳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Wallet Top-up</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Bank transfer</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-success)' }}>+$10,000</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>🎯 Finance Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/finance" className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📊</span> View Reports
                </Link>
                <Link href="/wallet" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>💳</span> Manage Wallet
                </Link>
                <Link href="/billing" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📋</span> Handle Invoices
                </Link>
                <Link href="/transactions" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📈</span> Transaction History
                </Link>
                <Link href="/settings" className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>⚙️</span> Payment Settings
                </Link>
              </div>
            </div>
          </div>
          </>
        );

      default:
        return (
          <>
            {/* Default/Member Dashboard */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-primary)', '--kpi-bg': 'var(--color-primary-light)', '--kpi-color': 'var(--color-primary)' } as React.CSSProperties}>
              <div className="kpi-icon">👋</div>
              <div className="kpi-label">Welcome</div>
              <div className="kpi-value">{user?.name?.split(' ')[0] || 'User'}</div>
              <div className="kpi-sub">Team member</div>
            </div>
            <Link href="/products" className="kpi-card" style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-light)', '--kpi-color': 'var(--color-success)' } as React.CSSProperties}>
              <div className="kpi-icon">📦</div>
              <div className="kpi-label">Products</div>
              <div className="kpi-value">—</div>
              <div className="kpi-sub">Browse marketplace</div>
            </Link>
            <Link href="/rfqs" className="kpi-card" style={{ '--kpi-accent': 'var(--color-info)', '--kpi-bg': 'var(--color-info-light)', '--kpi-color': 'var(--color-info)' } as React.CSSProperties}>
              <div className="kpi-icon">📋</div>
              <div className="kpi-label">RFQs</div>
              <div className="kpi-value">—</div>
              <div className="kpi-sub">View requests</div>
            </Link>
            <Link href="/messages" className="kpi-card" style={{ '--kpi-accent': 'var(--color-warning)', '--kpi-bg': 'var(--color-warning-light)', '--kpi-color': 'var(--color-warning)' } as React.CSSProperties}>
              <div className="kpi-icon">💬</div>
              <div className="kpi-label">Messages</div>
              <div className="kpi-value">—</div>
              <div className="kpi-sub">Team communication</div>
            </Link>
          </div>

          <div className="card card-glass">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>👤 Member Overview</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Welcome to the ETHIO-BRIDGE platform! Contact your organization administrator for access to additional features and permissions.
            </p>
          </div>
          </>
        );
    }
  };

  return (
    <Shell orgName={orgEntry?.organization.legalName}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>
            {user ? dt('greeting', { name: user.name }) : dt('greeting', { name: '' })}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Role: <span className="badge badge-violet" style={{ textTransform: 'capitalize' }}>{userRole}</span>
            {orgEntry && <span style={{ margin: '0 8px' }}>•</span>}
            {orgEntry && <span style={{ color: 'var(--text-tertiary)' }}>{orgEntry.organization.legalName}</span>}
          </p>
        </div>
        {userRole === 'owner' && (
          <Link href="/settings" className="btn btn-primary">
            ⚙️ Settings
          </Link>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          {dt('dashboards')}
        </span>
        <button
          type="button"
          className={previewRole === '' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          onClick={() => setPreviewRole('')}
        >
          🎯 My Dashboard
        </button>
        {previews.map((r) => (
          <button
            key={r}
            type="button"
            className={previewRole === r ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setPreviewRole(r)}
          >
            {previewLabel(r)}
          </button>
        ))}
        <button
          type="button"
          className={previewRole === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
          onClick={() => setPreviewRole(previewRole === 'all' ? '' : 'all')}
        >
          📊 Show All
        </button>
      </div>

      {busy ? <p>{t('common.loading')}</p> : null}
      {error ? <div className="error-text">{error}</div> : null}

      {!busy && !orgEntry ? (
        <div className="card">
          <p>{dt('noOrg')}</p>
          <Link href="/create-organization" className="btn">
            {t('nav.createOrganization')}
          </Link>
        </div>
      ) : null}

      {orgEntry ? (
        <>
          {previewRole === 'all' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {previews.map((r) => (
                <section key={r}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, margin: 0 }}>{previewLabel(r)} Dashboard</h2>
                    {r === userRole ? (
                      <span className="badge badge-active">Your role</span>
                    ) : (
                      <span className="badge badge-planned">Preview</span>
                    )}
                  </div>
                  {renderDashboard(r)}
                </section>
              ))}
            </div>
          ) : (
            renderDashboard(effectiveRole)
          )}

          {/* Organization Info Card - shown for all roles */}
          <div className="card card-glass" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, marginBottom: 4 }}>{dt('orgCardTitle')}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{orgEntry.organization.legalName}</p>
              </div>
              <Link href="/company-profile" className="btn btn-sm btn-outline">
                {t('nav.companyProfile')}
              </Link>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="detail-panel">
                <div className="detail-heading">{org('businessTypeLabel')}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{orgEntry.organization.businessType}</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">{org('countryLabel')}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{orgEntry.organization.country ?? '—'}</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">{org('cityLabel')}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{orgEntry.organization.city ?? '—'}</div>
              </div>
              <div className="detail-panel">
                <div className="detail-heading">Your Role</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  <span className="badge badge-emerald">{orgEntry.title}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {features && userRole === 'owner' ? (
        <>
          <h2 style={{ marginTop: 32, marginBottom: 16 }}>{dt('activeFeatureSection')}</h2>
          {features.active.length === 0 ? (
            <p className="empty">{dt('noActiveFeatures')}</p>
          ) : (
            <div className="grid">
              {features.active.map((f) => (
                <div className="feature-card" key={f.id}>
                  <strong>{cc(catalogCode(f.nameKey))}</strong>
                  <div>
                    <span className="badge badge-active">{t('featuresPage.active')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ marginTop: 24, marginBottom: 16 }}>{dt('availableFeatureSection')}</h2>
          {workspace.length === 0 ? (
            <p className="empty">{dt('noActiveFeatures')}</p>
          ) : (
            <div className="grid">
              {workspace.map((f) => (
                <div className="feature-card" key={f.id}>
                  <strong>{cc(catalogCode(f.nameKey))}</strong>
                  <div>
                    <span className="badge badge-active">{t('featuresPage.statusImplemented')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ marginTop: 24, marginBottom: 16 }}>{dt('availableSoonSection')}</h2>
          {planned.length === 0 ? (
            <p className="empty">{dt('noActiveFeatures')}</p>
          ) : (
            <div className="grid">
              {planned.map((f) => (
                <div className="feature-card" key={f.id}>
                  <strong>{cc(catalogCode(f.nameKey))}</strong>
                  <div>
                    <span className="badge badge-planned">{t('dash.planned')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p style={{ color: '#61708b', fontSize: 13, marginTop: 16 }}>{dt('featuresNote')}</p>
        </>
      ) : null}
    </Shell>
  );
}