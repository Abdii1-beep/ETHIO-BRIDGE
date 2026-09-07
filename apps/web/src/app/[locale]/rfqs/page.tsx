'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';
import { useTranslations } from 'next-intl';

export default function RfqsPage() {
  const t = useTranslations('nav');
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<any | null>(null);

  // New RFQ form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Solar Energy & Machinery');
  const [quantity, setQuantity] = useState('10');
  const [targetBudget, setTargetBudget] = useState('20000');
  const [currency, setCurrency] = useState('USD');
  const [destination, setDestination] = useState('Addis Ababa, Ethiopia');

  // Quotation form state
  const [unitPrice, setUnitPrice] = useState('1800');
  const [quotationQty, setQuotationQty] = useState('10');
  const [shippingCost, setShippingCost] = useState('500');
  const [deliveryDays, setDeliveryDays] = useState('20');
  const [notes, setNotes] = useState('Direct factory shipment with 1-year warranty.');
  const [submitting, setSubmitting] = useState(false);
  const [commissionPreview, setCommissionPreview] = useState<any | null>(null);

  const loadRfqs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/api/v1/rfqs');
      if (res.success && res.data) {
        setRfqs(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRfqs();
  }, []);

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<any>('/api/v1/rfqs', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          targetCategory: category,
          quantity: Number(quantity),
          targetBudget: Number(targetBudget),
          currency,
          destination,
        }),
      });
      if (res.success) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        loadRfqs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectRfqForQuotation = async (rfq: any) => {
    setSelectedRfq(rfq);
    setQuotationQty(String(rfq.quantity));
    // Calculate estimated commission
    const total = Number(unitPrice) * Number(rfq.quantity) + Number(shippingCost);
    const commRes = await apiFetch<any>('/api/v1/commissions/calculate', {
      method: 'POST',
      body: JSON.stringify({ grossAmount: total, currency: rfq.currency }),
    });
    if (commRes.success) {
      setCommissionPreview(commRes.data);
    }
  };

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<any>(`/api/v1/rfqs/${selectedRfq.id}/quotations`, {
        method: 'POST',
        body: JSON.stringify({
          unitPrice: Number(unitPrice),
          quantity: Number(quotationQty),
          shippingCost: Number(shippingCost),
          deliveryDays: Number(deliveryDays),
          notes,
          currency: selectedRfq.currency,
        }),
      });

      if (res.success) {
        alert('Quotation submitted successfully to the buyer!');
        setSelectedRfq(null);
        loadRfqs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuotation = async (quotationId: string) => {
    if (!confirm('Accept this quotation and create trade order with platform commission?')) return;
    try {
      const res = await apiFetch<any>(`/api/v1/quotations/${quotationId}/accept`, {
        method: 'POST',
      });
      if (res.success) {
        alert('Order generated! Platform commission calculated and recorded.');
        loadRfqs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Shell>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              📋 B2B Request for Quotation (RFQ) Hub
            </h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
              Connect directly with verified Chinese & Ethiopian buyers and suppliers.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Post New RFQ
          </button>
        </div>

        {/* RFQ List */}
        {loading ? (
          <p style={{ color: '#64748b' }}>Loading RFQs...</p>
        ) : rfqs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <p>No active RFQs found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rfqs.map((rfq) => (
              <div
                key={rfq.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: 18,
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                      {rfq.targetCategory}
                    </span>
                    <span style={{ fontSize: 12, backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      {rfq.status}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      Buyer: <strong>{rfq.buyerOrg?.tradingName ?? rfq.buyerOrg?.legalName}</strong> ({rfq.buyerOrg?.country ?? 'Ethiopia'})
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
                    {rfq.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#475569', margin: '0 0 10px 0', maxWidth: 600 }}>
                    {rfq.description}
                  </p>

                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#334155' }}>
                    <span>📦 Required Quantity: <strong>{rfq.quantity} {rfq.unit}</strong></span>
                    <span>💰 Target Budget: <strong>{rfq.currency} {Number(rfq.targetBudget ?? 0).toLocaleString()}</strong></span>
                    <span>📍 Destination: <strong>{rfq.destination}</strong></span>
                    <span>💬 Quotations: <strong>{rfq._count?.quotations ?? 0}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSelectRfqForQuotation(rfq)}
                  >
                    Submit Quotation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post RFQ Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 550, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px 0' }}>Post New RFQ to Suppliers</h2>
            <form onSubmit={handleCreateRfq}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>RFQ Title</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Need 500 Solar Irrigation Pumps 10kW"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Category</label>
                  <select className="input" style={{ width: '100%' }} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Solar Energy & Machinery">Solar & Machinery</option>
                    <option value="Agricultural Equipment">Agriculture</option>
                    <option value="Specialty Coffee">Specialty Coffee</option>
                    <option value="Electronics & IT">Electronics</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Quantity</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Target Budget</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Currency</label>
                  <select className="input" style={{ width: '100%' }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="USD">USD ($)</option>
                    <option value="ETB">ETB (Br)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Delivery Destination</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Technical Requirements</label>
                <textarea
                  className="input"
                  style={{ width: '100%', minHeight: 80 }}
                  placeholder="Mention standard certifications, power voltage, shipment terms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish RFQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Quotation Modal */}
      {selectedRfq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 550 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px 0' }}>
              Submit Official Quotation for: {selectedRfq.title}
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px 0' }}>
              Buyer: {selectedRfq.buyerOrg?.legalName} | Quantity: {selectedRfq.quantity} {selectedRfq.unit}
            </p>

            <form onSubmit={handleSubmitQuotation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Unit Price ({selectedRfq.currency})</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Quantity</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    value={quotationQty}
                    onChange={(e) => setQuotationQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Est. Shipping Cost ({selectedRfq.currency})</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Delivery Lead Time (Days)</label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(e.target.value)}
                  />
                </div>
              </div>

              {/* Commission calculation preview */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 4 }}>
                  <span>Gross Transaction Total:</span>
                  <span>{selectedRfq.currency} {(Number(unitPrice) * Number(quotationQty) + Number(shippingCost)).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#15803d' }}>
                  <span>Platform Service Fee ({commissionPreview?.feePercentage ?? 2}%):</span>
                  <span>{selectedRfq.currency} {((Number(unitPrice) * Number(quotationQty) + Number(shippingCost)) * 0.02).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#166534', marginTop: 4, borderTop: '1px dashed #86efac', paddingTop: 4 }}>
                  <span>Net Supplier Payout:</span>
                  <span>{selectedRfq.currency} {((Number(unitPrice) * Number(quotationQty) + Number(shippingCost)) * 0.98).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedRfq(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Send Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
