'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: '🌱',
    price: 99,
    currency: 'USD',
    period: 'month',
    description: 'Perfect for small traders and sourcing agents getting started with cross-border trade',
    color: 'var(--text-secondary)',
    features: [
      '5 product listings',
      '10 RFQ per month',
      'Basic marketplace access',
      'Email support',
      'English + 1 language',
      '0.5% AI translation credit',
    ],
    limits: { products: 5, rfqs: 10, branches: 1, users: 3 },
    cta: 'Start Free Trial',
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: '🚀',
    price: 299,
    currency: 'USD',
    period: 'month',
    description: 'For growing B2B companies managing serious import/export volumes',
    color: 'var(--color-primary)',
    badge: '🔥 Most Popular',
    features: [
      '50 product listings',
      'Unlimited RFQs',
      'Priority marketplace placement',
      'AI auto-translation (EN ↔ ZH ↔ AM)',
      'CRM & deal pipeline',
      'Analytics dashboard',
      'Phone + email support',
      '3 branch offices',
      '10 team members',
    ],
    limits: { products: 50, rfqs: -1, branches: 3, users: 10 },
    cta: 'Get Growth Plan',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: '🏛️',
    price: 999,
    currency: 'USD',
    period: 'month',
    description: 'For large corporations with complex global supply chains and high transaction volumes',
    color: 'var(--color-primary)',
    badge: '⭐ Premium',
    features: [
      'Unlimited product listings',
      'Unlimited RFQs & orders',
      'Featured marketplace placement',
      'Full AI suite (translation + RFQ assist)',
      'Full CRM + messaging',
      'Dedicated account manager',
      'Custom commission rates',
      'API access & integrations',
      'Unlimited branches & users',
      'SLA 99.9% uptime guarantee',
      'Regulatory compliance assistance',
    ],
    limits: { products: -1, rfqs: -1, branches: -1, users: -1 },
    cta: 'Contact Sales',
  },
  {
    id: 'government',
    name: 'Gov / NGO',
    icon: '🏛',
    price: 'Custom',
    currency: '',
    period: '',
    description: 'For Ethiopian government entities and international NGOs facilitating trade programs',
    color: 'var(--color-success)',
    badge: '🌍 Global',
    features: [
      'All Enterprise features',
      'Multi-tenancy support',
      'Custom procurement workflows',
      'NBE compliance reporting',
      'ERCA integration ready',
      'Diplomatic trade facilitation',
      'EthSwitch payment integration',
      'Priority customs advisory',
    ],
    limits: { products: -1, rfqs: -1, branches: -1, users: -1 },
    cta: 'Request Proposal',
  },
];

interface ActiveSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  seats: number;
  features: string[];
}

export default function BillingPage() {
  const [sub, setSub] = useState<ActiveSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiFetch<ActiveSubscription>('/api/v1/billing/subscription').then(r => {
      if (r.success && r.data) setSub(r.data);
      setLoading(false);
    });
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    const res = await apiFetch<{ checkoutUrl?: string; message?: string }>('/api/v1/billing/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId, interval: period }),
    });
    setUpgrading(null);
    if (res.data?.checkoutUrl) {
      window.open(res.data.checkoutUrl, '_blank');
    } else {
      setMsg(res.data?.message ?? 'Plan upgrade initiated. Your account manager will reach out within 24h.');
    }
  };

  const activePlan = PLANS.find(p => p.id === sub?.planId);
  const yearMultiplier = period === 'year' ? 0.85 : 1;

  return (
    <Shell>
      <div className="page-header">
        <h1 className="page-title">⭐ Platform Subscription</h1>
        <p className="page-subtitle">Choose the plan that matches your global trade ambitions</p>
      </div>

      {/* Current Subscription */}
      {!loading && sub && (
        <div className="card mb-5" style={{ borderLeft: `4px solid ${activePlan?.color ?? 'var(--color-primary)'}` }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
                Current Plan
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                {activePlan?.icon} {activePlan?.name ?? sub.planId} Plan
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Renews: {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', { dateStyle: 'long' })}
                {sub.cancelAtPeriodEnd && ' · ⚠️ Cancels at period end'}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <span className={`badge ${sub.status === 'ACTIVE' ? 'badge-emerald' : 'badge-amber'}`}>
                {sub.status}
              </span>
              <button className="btn btn-secondary btn-sm">Manage Subscription</button>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-light)' }}>
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className="alert alert-success mb-4">{msg}</div>
      )}

      {/* Annual / Monthly Toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`font-bold ${period === 'month' ? 'text-primary-color' : 'text-muted'}`}>Monthly</span>
        <button
          style={{
            width: 52, height: 28, borderRadius: 14, background: period === 'year' ? 'var(--color-primary)' : 'var(--color-border)',
            border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
          }}
          onClick={() => setPeriod(p => p === 'month' ? 'year' : 'month')}
        >
          <span style={{
            position: 'absolute', top: 4, left: period === 'year' ? 28 : 4,
            width: 20, height: 20, borderRadius: '50%', background: 'white',
            transition: 'left 0.2s', display: 'block',
          }} />
        </button>
        <span className={`font-bold ${period === 'year' ? 'text-primary-color' : 'text-muted'}`}>
          Annual <span className="badge badge-emerald">Save 15%</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, marginBottom: 40 }}>
        {PLANS.map(plan => {
          const isActive = plan.id === sub?.planId;
          const numPrice = typeof plan.price === 'number' ? Math.round(plan.price * yearMultiplier) : null;
          return (
            <div
              key={plan.id}
              className="card"
              style={{
                border: isActive ? `2px solid ${plan.color}` : `1px solid var(--color-border)`,
                position: 'relative',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: 'white', borderRadius: '999px',
                  padding: '2px 14px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}

              {isActive && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: plan.color, color: 'white', borderRadius: '999px',
                  padding: '2px 10px', fontSize: 10, fontWeight: 800,
                }}>
                  ✓ Active
                </div>
              )}

              <div style={{ fontSize: 32, marginBottom: 10 }}>{plan.icon}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: plan.color, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
                {plan.description}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                {numPrice !== null ? (
                  <>
                    <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      ${numPrice}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)', marginLeft: 4 }}>/ {period}</span>
                    {period === 'year' && typeof plan.price === 'number' && (
                      <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 2 }}>
                        Save ${Math.round(plan.price * 0.15 * 12)} / year
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 800, color: plan.color }}>Contact Us</span>
                )}
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <span style={{ color: plan.color, fontWeight: 800, marginTop: 1, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className="btn"
                style={{
                  width: '100%',
                  background: isActive ? 'var(--color-surface-2)' : plan.color,
                  color: isActive ? 'var(--text-secondary)' : 'white',
                  cursor: isActive ? 'default' : 'pointer',
                }}
                disabled={isActive || upgrading === plan.id}
                onClick={() => !isActive && handleUpgrade(plan.id)}
              >
                {upgrading === plan.id ? <span className="spinner" /> : isActive ? '✓ Current Plan' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Commission Model */}
      <div className="card">
        <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>💼 B2B Transaction Commission</h3>
        <p className="text-muted text-sm mb-4">
          Beyond subscription fees, ETHIO-BRIDGE earns a platform service fee on each completed transaction.
          This is our primary revenue stream and ensures aligned incentives — we succeed when your trades succeed.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {[
            { tier: 'Starter', rate: '3%', min: '$50', max: '$2,000', example: '$10K deal → $300 fee' },
            { tier: 'Growth', rate: '2%', min: '$100', max: '$5,000', example: '$20K deal → $400 fee' },
            { tier: 'Enterprise', rate: '1–1.5%', min: '$200', max: 'Negotiable', example: '$100K deal → $1,000+ fee' },
            { tier: 'Gov / NGO', rate: 'Custom', min: 'Waivable', max: 'Custom cap', example: 'Volume-based rates' },
          ].map(tier => (
            <div key={tier.tier} className="detail-panel" style={{ border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{tier.tier} Plan</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)', marginBottom: 4 }}>{tier.rate}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                Min: {tier.min} · Max: {tier.max}
              </div>
              <div className="badge badge-violet" style={{ fontSize: 11 }}>{tier.example}</div>
            </div>
          ))}
        </div>
        <div className="hint-text mt-3">
          * Transaction fees are only charged on successfully completed and settled transactions.
          Failed orders, cancelled RFQs, and in-progress negotiations are never charged.
        </div>
      </div>
    </Shell>
  );
}
