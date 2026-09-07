'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePaymentOrder, setActivePaymentOrder] = useState<any | null>(null);
  const [paymentProvider, setPaymentProvider] = useState('NBE_LICENSED_PARTNER');
  const [paymentAttempt, setPaymentAttempt] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/api/v1/orders');
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleInitiatePayment = async (order: any) => {
    setActivePaymentOrder(order);
    setProcessing(true);
    try {
      const res = await apiFetch<any>('/api/v1/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          amount: Number(order.totalAmount),
          currency: order.currency,
          provider: paymentProvider,
        }),
      });
      if (res.success && res.data) {
        setPaymentAttempt(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentAttempt) return;
    setProcessing(true);
    try {
      const res = await apiFetch<any>('/api/v1/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentAttemptId: paymentAttempt.paymentAttemptId,
        }),
      });
      if (res.success) {
        alert('Payment confirmed through licensed partner switch! Order is now PAID.');
        setActivePaymentOrder(null);
        setPaymentAttempt(null);
        loadOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Shell>
      <div className="card">
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>
          📦 B2B Trade Orders & Settlement
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 24px 0' }}>
          All B2B transaction settlements are initiated through NBE-licensed National Switch / payment partner infrastructure.
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <p>No orders currently active. Accept a quotation from the RFQ Hub to generate a trade order.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <th style={{ padding: '10px 12px' }}>Order ID</th>
                  <th style={{ padding: '10px 12px' }}>Buyer Organization</th>
                  <th style={{ padding: '10px 12px' }}>Seller Organization</th>
                  <th style={{ padding: '10px 12px' }}>Gross Value</th>
                  <th style={{ padding: '10px 12px' }}>Platform Fee (2%)</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{o.id.slice(0, 8)}...</td>
                    <td style={{ padding: '12px' }}>{o.buyerOrg?.tradingName ?? o.buyerOrg?.legalName}</td>
                    <td style={{ padding: '12px' }}>{o.sellerOrg?.tradingName ?? o.sellerOrg?.legalName}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#16a34a' }}>
                      {o.currency} {Number(o.totalAmount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', color: '#2563eb', fontWeight: 600 }}>
                      {o.currency} {Number(o.commissionAmount).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          backgroundColor: o.status === 'PAID' ? '#dcfce7' : '#fef3c7',
                          color: o.status === 'PAID' ? '#166534' : '#92400e',
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {o.status === 'PENDING' ? (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={() => handleInitiatePayment(o)}
                        >
                          💳 Pay Partner
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {activePaymentOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 500 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px 0' }}>
              Licensed Payment Partner Checkout
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px 0' }}>
              Order: {activePaymentOrder.id} | Amount: {activePaymentOrder.currency} {Number(activePaymentOrder.totalAmount).toLocaleString()}
            </p>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <strong>Payment Channel:</strong>
              </div>
              <select
                className="input"
                style={{ width: '100%', marginBottom: 10 }}
                value={paymentProvider}
                onChange={(e) => setPaymentProvider(e.target.value)}
              >
                <option value="NBE_LICENSED_PARTNER">EthSwitch / NBE Licensed Switch</option>
                <option value="TELEBIRR">Telebirr SuperApp Partner</option>
                <option value="CHAPA">Commercial Bank / Card Partner</option>
              </select>

              {paymentAttempt && (
                <div style={{ fontSize: 12, color: '#334155', backgroundColor: '#e2e8f0', padding: 8, borderRadius: 4 }}>
                  <div><strong>Reference:</strong> {paymentAttempt.providerRef}</div>
                  <div style={{ marginTop: 4 }}>{paymentAttempt.partnerNotice}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setActivePaymentOrder(null);
                  setPaymentAttempt(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmPayment}
                disabled={processing}
              >
                {processing ? 'Connecting Switch...' : 'Confirm Partner Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
