'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';

export default function AdminRevenuePage() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch<any>('/api/v1/admin/revenue');
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const overview = analytics?.overview;

  return (
    <Shell>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              📊 Platform Owner Revenue & Profit Analytics
            </h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
              Real-time financial performance across B2B Trade Commissions, SaaS Subscriptions, and Pay-Per-Use AI.
            </p>
          </div>
          <span style={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>
            Live Platform Ledger
          </span>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Computing financial statements from database...</p>
        ) : (
          <>
            {/* Top KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div style={{ padding: 20, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Gross Platform Revenue</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#15803d', marginTop: 4 }}>
                  ETB {Number(overview?.grossRevenue ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#166534', marginTop: 4 }}>Commissions + Subscriptions + AI</div>
              </div>

              <div style={{ padding: 20, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
                <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>Estimated Net Profit</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                  ETB {Number(overview?.netProfit ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#1e40af', marginTop: 4 }}>After AI compute & Switch fees</div>
              </div>

              <div style={{ padding: 20, backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: 10 }}>
                <div style={{ fontSize: 13, color: '#854d0e', fontWeight: 600 }}>Total B2B Trade Facilitated</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#a16207', marginTop: 4 }}>
                  ETB {Number(overview?.totalGrossTrade ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#854d0e', marginTop: 4 }}>Gross merchandise volume</div>
              </div>

              <div style={{ padding: 20, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Active Subscribed Companies</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                  {overview?.activeSubscriptionsCount ?? 0}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Recurring monthly revenue</div>
              </div>
            </div>

            {/* Breakdown by Stream */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
                  Revenue Stream Distribution
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {analytics?.revenueByStream?.map((st: any) => (
                    <div key={st.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{st.name}</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          ETB {Number(st.value).toLocaleString()} ({st.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${st.percentage}%`, height: '100%', backgroundColor: '#2563eb' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
                  Estimated Platform Direct Costs (SDD §128)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                    <span style={{ color: '#64748b' }}>AI Provider API Compute (Qwen / GPT):</span>
                    <span style={{ fontWeight: 600, color: '#dc2626' }}>- ETB {Number(overview?.estimatedAiCost ?? 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                    <span style={{ color: '#64748b' }}>Payment Partner / Switch Fees (EthSwitch):</span>
                    <span style={{ fontWeight: 600, color: '#dc2626' }}>- ETB {Number(overview?.estimatedPartnerFee ?? 0).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700, fontSize: 14 }}>
                    <span>Estimated Net Contribution:</span>
                    <span style={{ color: '#16a34a' }}>ETB {Number(overview?.netProfit ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Trade Commissions */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a' }}>
                Recent Platform Commission Transactions (2% B2B Facilitation)
              </h3>
              {analytics?.recentCommissions?.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 13 }}>No trade commissions recorded yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                        <th style={{ padding: '8px 10px' }}>Order Ref</th>
                        <th style={{ padding: '8px 10px' }}>Gross Trade</th>
                        <th style={{ padding: '8px 10px' }}>Platform Fee (2%)</th>
                        <th style={{ padding: '8px 10px' }}>Net to Seller</th>
                        <th style={{ padding: '8px 10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.recentCommissions?.map((c: any) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c.orderId ? c.orderId.slice(0, 8) : 'Manual'}</td>
                          <td style={{ padding: '8px 10px' }}>{c.currency} {Number(c.grossAmount).toLocaleString()}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#2563eb' }}>{c.currency} {Number(c.feeAmount).toLocaleString()}</td>
                          <td style={{ padding: '8px 10px', color: '#16a34a' }}>{c.currency} {Number(c.netAmount).toLocaleString()}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{ fontSize: 11, backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
