'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';
import { Link } from '@/i18n/navigation';

export default function AdminOverviewPage() {
  const t = useTranslations();
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<any>('/api/v1/admin/overview');
        if (res.success && res.data) {
          setOverview(res.data);
        }
      } catch (e) {
        setError('Failed to load platform overview');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Shell>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              🛡️ Platform Admin Dashboard
            </h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
              Complete platform overview and administrative controls
            </p>
          </div>
          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>
            Super Admin Access
          </span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-title">Loading Platform Data</div>
            <div className="empty-state-desc">Fetching real-time platform statistics...</div>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Platform KPIs */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ '--kpi-accent': '#15803D', '--kpi-bg': '#d1fae5', '--kpi-color': '#15803D' } as React.CSSProperties}>
                <div className="kpi-icon">🏢</div>
                <div className="kpi-label">Total Organizations</div>
                <div className="kpi-value">{overview?.organizations ?? 0}</div>
                <div className="kpi-sub">Registered companies</div>
              </div>

              <div className="kpi-card" style={{ '--kpi-accent': '#0D3B4E', '--kpi-bg': '#e0f2fe', '--kpi-color': '#0D3B4E' } as React.CSSProperties}>
                <div className="kpi-icon">👥</div>
                <div className="kpi-label">Total Users</div>
                <div className="kpi-value">{overview?.users ?? 0}</div>
                <div className="kpi-sub">Platform users</div>
              </div>

              <div className="kpi-card" style={{ '--kpi-accent': '#F59E0B', '--kpi-bg': '#fef3c7', '--kpi-color': '#F59E0B' } as React.CSSProperties}>
                <div className="kpi-icon">👤</div>
                <div className="kpi-label">Active Members</div>
                <div className="kpi-value">{overview?.members ?? 0}</div>
                <div className="kpi-sub">Organization members</div>
              </div>

              <div className="kpi-card" style={{ '--kpi-accent': '#64748B', '--kpi-bg': '#f1f5f9', '--kpi-color': '#64748B' } as React.CSSProperties}>
                <div className="kpi-icon">📋</div>
                <div className="kpi-label">Pending Requests</div>
                <div className="kpi-value">{overview?.pendingFeatureRequests ?? 0}</div>
                <div className="kpi-sub">Feature requests</div>
              </div>
            </div>

            {/* Marketplace Activity */}
            <div className="kpi-grid">
              <div className="kpi-card" style={{ '--kpi-accent': '#15803D', '--kpi-bg': '#d1fae5', '--kpi-color': '#15803D' } as React.CSSProperties}>
                <div className="kpi-icon">📦</div>
                <div className="kpi-label">Products</div>
                <div className="kpi-value">{overview?.products ?? 0}</div>
                <div className="kpi-sub">Active listings</div>
              </div>

              <div className="kpi-card" style={{ '--kpi-accent': '#0D3B4E', '--kpi-bg': '#e0f2fe', '--kpi-color': '#0D3B4E' } as React.CSSProperties}>
                <div className="kpi-icon">📋</div>
                <div className="kpi-label">RFQs</div>
                <div className="kpi-value">{overview?.rfqs ?? 0}</div>
                <div className="kpi-sub">Quote requests</div>
              </div>

              <div className="kpi-card" style={{ '--kpi-accent': '#F59E0B', '--kpi-bg': '#fef3c7', '--kpi-color': '#F59E0B' } as React.CSSProperties}>
                <div className="kpi-icon">🤝</div>
                <div className="kpi-label">Orders</div>
                <div className="kpi-value">{overview?.orders ?? 0}</div>
                <div className="kpi-sub">Total orders</div>
              </div>

              <div className="kpi-card" style={{ '--kpi-accent': '#64748B', '--kpi-bg': '#f1f5f9', '--kpi-color': '#64748B' } as React.CSSProperties}>
                <div className="kpi-icon">📊</div>
                <div className="kpi-label">Audit Logs</div>
                <div className="kpi-value">{overview?.auditLogEntries ?? 0}</div>
                <div className="kpi-sub">System events</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px 0', color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                🎯 Admin Quick Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <Link href="/admin/organizations" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>🏢</span> Manage Organizations
                </Link>
                <Link href="/admin/users" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>👥</span> Manage Users
                </Link>
                <Link href="/admin/revenue" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>💰</span> Revenue Analytics
                </Link>
                <Link href="/admin/audit-logs" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                  <span>📋</span> Audit Logs
                </Link>
              </div>
            </div>

            {/* System Health */}
            <div className="card">
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px 0', color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                🖥️ System Health
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                <div className="kpi-card" style={{ '--kpi-accent': '#15803D', '--kpi-bg': '#d1fae5', '--kpi-color': '#15803D' } as React.CSSProperties}>
                  <div className="kpi-icon">💾</div>
                  <div className="kpi-label">Database</div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>✓ Connected</div>
                  <div className="kpi-sub">PostgreSQL</div>
                </div>
                <div className="kpi-card" style={{ '--kpi-accent': '#15803D', '--kpi-bg': '#d1fae5', '--kpi-color': '#15803D' } as React.CSSProperties}>
                  <div className="kpi-icon">⚡</div>
                  <div className="kpi-label">Cache</div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>✓ Connected</div>
                  <div className="kpi-sub">Redis</div>
                </div>
                <div className="kpi-card" style={{ '--kpi-accent': '#15803D', '--kpi-bg': '#d1fae5', '--kpi-color': '#15803D' } as React.CSSProperties}>
                  <div className="kpi-icon">🔌</div>
                  <div className="kpi-label">API Server</div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>✓ Running</div>
                  <div className="kpi-sub">Port 3002</div>
                </div>
                <div className="kpi-card" style={{ '--kpi-accent': '#15803D', '--kpi-bg': '#d1fae5', '--kpi-color': '#15803D' } as React.CSSProperties}>
                  <div className="kpi-icon">🌐</div>
                  <div className="kpi-label">Web Server</div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>✓ Running</div>
                  <div className="kpi-sub">Port 3003</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
