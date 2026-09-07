'use client';

import { useEffect, useState, useRef } from 'react';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';

const STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST'] as const;
type Stage = typeof STAGES[number];

const STAGE_CONFIG: Record<Stage, { color: string; bg: string; icon: string; label: string }> = {
  NEW:         { color: 'var(--color-primary)', bg: 'var(--color-primary-light)', icon: '🌱', label: 'New Lead' },
  CONTACTED:   { color: 'var(--color-info)', bg: 'var(--color-info-light)', icon: '📞', label: 'Contacted' },
  QUALIFIED:   { color: 'var(--color-warning)', bg: 'var(--color-warning-light)', icon: '✅', label: 'Qualified' },
  NEGOTIATING: { color: 'var(--color-primary)', bg: 'var(--color-primary-light)', icon: '🤝', label: 'Negotiating' },
  WON:         { color: 'var(--color-success)', bg: 'var(--color-success-light)', icon: '🏆', label: 'Won' },
  LOST:        { color: 'var(--color-danger)', bg: 'var(--color-danger-light)', icon: '❌', label: 'Lost' },
};

export default function CrmPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dealValue, setDealValue] = useState('500000');
  const [stage, setStage] = useState<Stage>('NEW');
  const [country, setCountry] = useState('China');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await apiFetch<any[]>('/api/v1/crm/leads');
    if (res.success && res.data) setLeads(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiFetch<any>('/api/v1/crm/leads', {
      method: 'POST',
      body: JSON.stringify({ companyName, contactName, email, phone, stage, dealValue: Number(dealValue), currency: 'ETB' }),
    });
    if (res.success) { setShowModal(false); setCompanyName(''); setContactName(''); load(); }
    setSubmitting(false);
  };

  const handleMove = async (leadId: string, newStage: Stage) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    await apiFetch(`/api/v1/crm/leads/${leadId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage: newStage }),
    });
    load();
  };

  const stageLeads = (s: Stage) => leads.filter(l => l.stage === s);
  const stageValue = (s: Stage) => stageLeads(s).reduce((acc, l) => acc + Number(l.dealValue ?? 0), 0);

  const totalPipeline = leads
    .filter(l => l.stage !== 'LOST')
    .reduce((acc, l) => acc + Number(l.dealValue ?? 0), 0);
  const wonValue = stageValue('WON');
  const winRate = leads.length ? Math.round((stageLeads('WON').length / leads.length) * 100) : 0;

  return (
    <Shell>
      <div className="page-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="page-title">📈 CRM — Global Deal Pipeline</h1>
            <p className="page-subtitle">Track supplier negotiations, buyer leads, and cross-border commercial agreements</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Deal</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid mb-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="kpi-card" style={{ '--kpi-accent':'var(--color-primary)', '--kpi-bg':'var(--color-primary-light)', '--kpi-color':'var(--color-primary)' } as any}>
          <div className="kpi-icon">🌐</div>
          <div className="kpi-label">Total Pipeline</div>
          <div className="kpi-value">ETB {(totalPipeline/1000).toFixed(0)}K</div>
          <div className="kpi-sub">{leads.filter(l => l.stage !== 'LOST').length} active deals</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent':'var(--color-success)', '--kpi-bg':'var(--color-success-light)', '--kpi-color':'var(--color-success)' } as any}>
          <div className="kpi-icon">🏆</div>
          <div className="kpi-label">Revenue Won</div>
          <div className="kpi-value">ETB {(wonValue/1000).toFixed(0)}K</div>
          <div className="kpi-sub">{stageLeads('WON').length} closed deals</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent':'var(--color-warning)', '--kpi-bg':'var(--color-warning-light)', '--kpi-color':'var(--color-warning)' } as any}>
          <div className="kpi-icon">🤝</div>
          <div className="kpi-label">Negotiating</div>
          <div className="kpi-value">ETB {(stageValue('NEGOTIATING')/1000).toFixed(0)}K</div>
          <div className="kpi-sub">{stageLeads('NEGOTIATING').length} in progress</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent':'var(--color-primary)', '--kpi-bg':'var(--color-primary-light)', '--kpi-color':'var(--color-primary)' } as any}>
          <div className="kpi-icon">📊</div>
          <div className="kpi-label">Win Rate</div>
          <div className="kpi-value">{winRate}%</div>
          <div className="kpi-sub">Based on {leads.length} total deals</div>
        </div>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="flex gap-4">
          {STAGES.map(s => (
            <div key={s} className="kanban-col">
              <div className="kanban-col-header">
                <div className="skeleton" style={{ height: 12, width: 80 }} />
              </div>
              <div className="kanban-cards">
                {[0,1].map(i => (
                  <div key={i} className="kanban-card">
                    <div className="skeleton mb-2" style={{ height: 14, width: '80%' }} />
                    <div className="skeleton" style={{ height: 12, width: '55%' }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="kanban-board">
          {STAGES.map(s => {
            const cfg = STAGE_CONFIG[s];
            const sLeads = stageLeads(s);
            return (
              <div key={s} className="kanban-col">
                <div className="kanban-col-header">
                  <span>{cfg.icon} {cfg.label}</span>
                  <span className="kanban-count">{sLeads.length}</span>
                </div>
                <div style={{ padding: '8px 10px 4px', fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  ETB {stageValue(s).toLocaleString()}
                </div>
                <div className="kanban-cards">
                  {sLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="kanban-card"
                      onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                        {lead.companyName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        {lead.contactName}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-success)', marginBottom: 8 }}>
                        {lead.currency ?? 'ETB'} {Number(lead.dealValue).toLocaleString()}
                      </div>

                      {selectedLead?.id === lead.id && (
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                            MOVE TO:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {STAGES.filter(st => st !== s).map(st => (
                              <button
                                key={st}
                                className="btn btn-sm btn-outline"
                                style={{ fontSize: 10, padding: '3px 8px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMove(lead.id, st);
                                  setSelectedLead(null);
                                }}
                              >
                                {STAGE_CONFIG[st].icon} {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {sLeads.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-tertiary)', fontSize: 12 }}>
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ width: 500, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Add New Deal to Pipeline</h2>
              <button className="btn-link" style={{ fontSize: 18 }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Company / Organization *</label>
                  <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="e.g. Guangzhou Solar Tech Ltd" />
                </div>
                <div className="field">
                  <label className="field-label">Contact Person *</label>
                  <input className="input" value={contactName} onChange={e => setContactName(e.target.value)} required placeholder="Full name" />
                </div>
                <div className="field">
                  <label className="field-label">Email</label>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@company.com" />
                </div>
                <div className="field">
                  <label className="field-label">Country</label>
                  <select className="input" value={country} onChange={e => setCountry(e.target.value)}>
                    <option>China</option>
                    <option>Ethiopia</option>
                    <option>United Arab Emirates</option>
                    <option>Kenya</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Deal Value (ETB)</label>
                  <input className="input" type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} required min="0" />
                </div>
                <div className="field">
                  <label className="field-label">Initial Stage</label>
                  <select className="input" value={stage} onChange={e => setStage(e.target.value as Stage)}>
                    {STAGES.map(s => (
                      <option key={s} value={s}>{STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-4 justify-between">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : null} Add to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
