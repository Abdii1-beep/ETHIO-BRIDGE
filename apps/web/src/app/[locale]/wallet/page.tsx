'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';

interface WalletData {
  balance: number;
  reserved: number;
  currency: string;
}

interface TxEntry {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  createdAt: string;
  reference?: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [txns, setTxns] = useState<TxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'commissions' | 'payments' | 'subscriptions'>('all');

  const load = async () => {
    setLoading(true);
    const [wRes, tRes] = await Promise.all([
      apiFetch<WalletData>('/api/v1/wallet'),
      apiFetch<TxEntry[]>('/api/v1/wallet/transactions?limit=50'),
    ]);
    if (wRes.success && wRes.data) setWallet(wRes.data);
    if (tRes.success && tRes.data) setTxns(tRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredTxns = txns.filter(t => {
    if (activeTab === 'all') return true;
    if (activeTab === 'commissions') return t.type?.toLowerCase().includes('commission');
    if (activeTab === 'payments') return t.type?.toLowerCase().includes('payment');
    if (activeTab === 'subscriptions') return t.type?.toLowerCase().includes('subscription');
    return true;
  });

  const available = wallet ? wallet.balance - wallet.reserved : 0;

  const txTypeConfig: Record<string, { icon: string; color: string; label: string }> = {
    DEBIT:        { icon: '↑', color: 'var(--color-danger)', label: 'Debit' },
    CREDIT:       { icon: '↓', color: 'var(--color-success)', label: 'Credit' },
    RESERVE:      { icon: '🔒', color: 'var(--color-warning)', label: 'Reserved' },
    RELEASE:      { icon: '🔓', color: 'var(--color-primary)', label: 'Released' },
    COMMISSION:   { icon: '💼', color: 'var(--color-primary)', label: 'Commission' },
    SUBSCRIPTION: { icon: '⭐', color: 'var(--color-accent)', label: 'Subscription' },
    PAYMENT:      { icon: '💳', color: 'var(--color-success)', label: 'Payment' },
  };

  const getTxConfig = (type: string) => {
    for (const [key, cfg] of Object.entries(txTypeConfig)) {
      if (type?.toUpperCase().includes(key)) return cfg;
    }
    return { icon: '•', color: 'var(--text-secondary)', label: type };
  };

  return (
    <Shell>
      <div className="page-header">
        <h1 className="page-title">💳 Organization Wallet</h1>
        <p className="page-subtitle">Platform credits, commissions, reserved funds, and transaction history</p>
      </div>

      {/* Wallet Cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {/* Main Balance */}
        <div className="wallet-balance-card" style={{ flex: '1 1 280px', minWidth: 260 }}>
          <div className="wallet-label">Total Wallet Balance</div>
          <div className="wallet-amount">
            {loading ? (
              <div className="skeleton" style={{ height: 40, width: 160 }} />
            ) : (
              `${wallet?.currency ?? 'ETB'} ${Number(wallet?.balance ?? 0).toLocaleString()}`
            )}
          </div>
          <div style={{ position: 'relative', zIndex: 1, marginTop: 16, display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Available</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {(wallet?.currency ?? 'ETB')} {available.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Reserved</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {(wallet?.currency ?? 'ETB')} {Number(wallet?.reserved ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ flex: '2 1 400px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          <div className="kpi-card" style={{ '--kpi-accent':'#059669', '--kpi-bg':'#d1fae5', '--kpi-color':'#059669' } as any}>
            <div className="kpi-icon">✅</div>
            <div className="kpi-label">Credits In</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {txns.filter(t => t.amount > 0 && (t.type === 'CREDIT' || t.type === 'PAYMENT')).reduce((s, t) => s + t.amount, 0).toLocaleString()}
            </div>
            <div className="kpi-sub">Total received</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-accent':'#dc2626', '--kpi-bg':'#fee2e2', '--kpi-color':'#dc2626' } as any}>
            <div className="kpi-icon">📤</div>
            <div className="kpi-label">Debits Out</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString()}
            </div>
            <div className="kpi-sub">Total spent</div>
          </div>
          <div className="kpi-card" style={{ '--kpi-accent':'#d97706', '--kpi-bg':'#fef3c7', '--kpi-color':'#d97706' } as any}>
            <div className="kpi-icon">🔒</div>
            <div className="kpi-label">Reserved</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {Number(wallet?.reserved ?? 0).toLocaleString()}
            </div>
            <div className="kpi-sub">Pending orders</div>
          </div>
        </div>
      </div>

      {/* NBE Notice */}
      <div className="alert alert-global mb-4">
        🏦 <strong>Regulatory Notice</strong>: ETHIO-BRIDGE operates under NBE-regulated payment partnerships.
        Your funds are processed by licensed payment system operators under the National Bank of Ethiopia framework.
        ETHIO-BRIDGE does not hold customer settlement funds directly.
      </div>

      {/* Reserve/Release Controls */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontWeight: 800, fontSize: 15 }}>⚡ Quick Actions</h3>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="btn btn-primary">💰 Top Up via Partner Bank</button>
          <button className="btn btn-secondary">📋 Download Statement</button>
          <button className="btn btn-secondary">🔄 Request Refund</button>
          <button className="btn btn-outline">📊 Usage Analytics</button>
        </div>
        <div className="hint-text mt-2">
          * Top-up redirects to our licensed payment partner (EthSwitch / CBE-Birr integration pending final licensing approval).
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontWeight: 800, fontSize: 15 }}>Transaction History</h3>
          <span className="badge badge-gray">{txns.length} entries</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all','commissions','payments','subscriptions'] as const).map(tab => (
            <button
              key={tab}
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' ? '📋 All' : tab === 'commissions' ? '💼 Commissions' : tab === 'payments' ? '💳 Payments' : '⭐ Subscriptions'}
              <span className="tab-count">
                {tab === 'all' ? txns.length :
                 tab === 'commissions' ? txns.filter(t => t.type?.toLowerCase().includes('commission')).length :
                 tab === 'payments' ? txns.filter(t => t.type?.toLowerCase().includes('payment')).length :
                 txns.filter(t => t.type?.toLowerCase().includes('subscription')).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex gap-3 items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton mb-1" style={{ height: 12, width: '50%' }} />
                  <div className="skeleton" style={{ height: 10, width: '30%' }} />
                </div>
                <div className="skeleton" style={{ height: 16, width: 80 }} />
              </div>
            ))}
          </div>
        ) : filteredTxns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <div className="empty-state-title">No transactions yet</div>
            <div className="empty-state-desc">Complete your first order to see platform fee activity here</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map(tx => {
                  const cfg = getTxConfig(tx.type);
                  const isCredit = tx.amount > 0;
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12, color: cfg.color }}>
                          <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ maxWidth: 240, color: 'var(--text-secondary)', fontSize: 12 }}>
                        {tx.description}
                      </td>
                      <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                        {tx.reference?.slice(0, 12) ?? tx.id.slice(0, 12)}…
                      </td>
                      <td>
                        <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-emerald' : tx.status === 'PENDING' ? 'badge-amber' : 'badge-gray'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 14, color: isCredit ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {isCredit ? '+' : ''}{tx.currency} {Math.abs(tx.amount).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
