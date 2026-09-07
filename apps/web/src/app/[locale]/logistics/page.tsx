'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import Shell from '@/components/shell';

/* ------------------------------------------------------------------
   LOGISTICS & GLOBAL TARIFF CALCULATOR
   Cross-border route estimator with:
   - Sea / Air / Land route selection
   - HS code tariff lookup (demo)
   - Ethiopian Import duty calculator
   - Shipping cost estimator China → Djibouti → Ethiopia
   ------------------------------------------------------------------ */

const ROUTES = [
  {
    id: 'sea-djibouti',
    label: 'Sea → Djibouti → Addis',
    icon: '🚢',
    origin: 'Shanghai / Guangzhou',
    transit: 'Djibouti Port',
    destination: 'Addis Ababa, Ethiopia',
    transitDays: '25–35 days',
    transitTime: 30,
    baseCostPerCbm: 140,
    currency: 'USD',
    modes: ['FCL 20ft', 'FCL 40ft', 'LCL'],
    notes: 'Most economical. Connect via Ethio-Djibouti Railway.',
    map: {
      nodes: [
        { x: 130, y: 190, flag: '🇨🇳', label: 'Shanghai / Guangzhou', sub: 'Origin · China' },
        { x: 460, y: 120, flag: '🚢', label: 'Djibouti Port', sub: 'Transit · Sea leg' },
        { x: 790, y: 185, flag: '🇪🇹', label: 'Addis Ababa', sub: 'Destination · Ethiopia' },
      ],
      line: 'M 150,188 C 300,70 540,60 760,182',
    },
  },
  {
    id: 'air-bole',
    label: 'Air Freight → Bole Airport',
    icon: '✈️',
    origin: 'Beijing / Shanghai',
    transit: 'Direct Flight',
    destination: 'Addis Ababa Bole Intl',
    transitDays: '3–7 days',
    transitTime: 5,
    baseCostPerKg: 4.5,
    currency: 'USD',
    modes: ['Express', 'Economy Air'],
    notes: 'Fast for high-value, low-weight goods.',
    map: {
      nodes: [
        { x: 150, y: 195, flag: '🇨🇳', label: 'Beijing / Shanghai', sub: 'Origin · China' },
        { x: 465, y: 105, flag: '✈️', label: 'Direct Air Route', sub: 'Non-stop flight' },
        { x: 770, y: 175, flag: '🇪🇹', label: 'Bole Intl, Addis', sub: 'Destination · Ethiopia' },
      ],
      line: 'M 170,192 Q 460,10 750,170',
    },
  },
  {
    id: 'road-kenya',
    label: 'Sea → Mombasa → Road',
    icon: '🚛',
    origin: 'Shanghai / Guangzhou',
    transit: 'Mombasa Port + Nairobi',
    destination: 'Addis Ababa, Ethiopia',
    transitDays: '35–50 days',
    transitTime: 42,
    baseCostPerCbm: 115,
    currency: 'USD',
    modes: ['Road Freight'],
    notes: 'Alternative when Djibouti is congested.',
    map: {
      nodes: [
        { x: 120, y: 195, flag: '🇨🇳', label: 'Shanghai / Guangzhou', sub: 'Origin · China' },
        { x: 470, y: 165, flag: '🚛', label: 'Mombasa → Nairobi', sub: 'Sea + road leg' },
        { x: 795, y: 130, flag: '🇪🇹', label: 'Addis Ababa', sub: 'Destination · Ethiopia' },
      ],
      line: 'M 140,198 C 320,170 520,120 775,132',
    },
  },
];

// Demo HS Code Duty Rates — Ethiopia NBR tariff schedule (illustrative)
const HS_CODES: Record<string, { description: string; dutyRate: number; excise?: number; vat: number; hasPermit: boolean }> = {
  '8413': { description: 'Pumps for liquids (Solar Pumps)', dutyRate: 5, vat: 15, hasPermit: false },
  '8544': { description: 'Insulated wire & cable', dutyRate: 10, vat: 15, hasPermit: false },
  '0901': { description: 'Coffee (unroasted)', dutyRate: 0, vat: 0, hasPermit: true },
  '8704': { description: 'Motor vehicles for goods transport', dutyRate: 35, excise: 30, vat: 15, hasPermit: true },
  '2710': { description: 'Petroleum oils', dutyRate: 0, excise: 10, vat: 15, hasPermit: true },
  '8528': { description: 'Electronic display monitors', dutyRate: 10, vat: 15, hasPermit: false },
  '6203': { description: 'Suits, jackets, trousers (men)', dutyRate: 35, vat: 15, hasPermit: false },
  '8481': { description: 'Valves, pipe fittings (industrial)', dutyRate: 5, vat: 15, hasPermit: false },
};

function calcTariff(cif: number, hsCode: string) {
  const hs = HS_CODES[hsCode];
  if (!hs) return null;
  const customs = cif * (hs.dutyRate / 100);
  const excise = (cif + customs) * ((hs.excise ?? 0) / 100);
  const vat = (cif + customs + excise) * (hs.vat / 100);
  const total = customs + excise + vat;
  return { customs, excise, vat, total, dutyRate: hs.dutyRate, exciseRate: hs.excise ?? 0, vatRate: hs.vat, description: hs.description, hasPermit: hs.hasPermit };
}

function fmtUSD(v: number) { return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtETB(v: number) { return `ETB ${(v * 56).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

export default function LogisticsPage() {
  const [selectedRoute, setSelectedRoute] = useState(ROUTES[0]);
  const [goodsValue, setGoodsValue] = useState('20000');
  const [weight, setWeight] = useState('500');
  const [volume, setVolume] = useState('5');
  const [hsInput, setHsInput] = useState('8413');
  const [insuranceRate, setInsuranceRate] = useState('0.5');
  const [freightMode, setFreightMode] = useState(ROUTES[0].modes[0]);

  const route = selectedRoute;
  const fobValue = Number(goodsValue) || 0;
  const kg = Number(weight) || 0;
  const cbm = Number(volume) || 0;

  // Freight cost
  let freightCost = 0;
  if (route.baseCostPerCbm) freightCost = cbm * route.baseCostPerCbm;
  else if (route.baseCostPerKg) freightCost = kg * route.baseCostPerKg;

  // Insurance
  const insurance = fobValue * (Number(insuranceRate) / 100);

  // CIF = Cost + Insurance + Freight
  const cif = fobValue + insurance + freightCost;

  // Tariff
  const tariff = calcTariff(cif, hsInput);

  // Total landed cost
  const landedCost = cif + (tariff?.total ?? 0);

  // ETHIO Commission (2%)
  const ethioFee = fobValue * 0.02;

  const hsEntries = Object.entries(HS_CODES);

  return (
    <Shell>
      <div className="page-header">
        <h1 className="page-title">🚢 Global Logistics & Tariff Calculator</h1>
        <p className="page-subtitle">
          Route estimation · Ethiopian import duty calculator · Cross-border landed cost analysis
        </p>
      </div>

      <div className="alert alert-info mb-4" style={{ maxWidth: 760 }}>
        ℹ️ <strong>Regulatory Note</strong>: Duty rates are illustrative based on Ethiopian NBR tariff schedules.
        Always confirm with a licensed customs agent or ETHIO-BRIDGE trade advisor before transaction.
      </div>

      {/* Step 1: Route Selection */}
      <div className="card mb-4">
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>1 · Choose Trade Route</h2>
        <div className="flex gap-3 flex-wrap">
          {ROUTES.map(r => (
            <div
              key={r.id}
              className="card card-hover"
              style={{
                flex: '1 1 220px',
                borderColor: selectedRoute.id === r.id ? 'var(--color-primary)' : undefined,
                background: selectedRoute.id === r.id ? 'var(--color-primary-light)' : undefined,
                cursor: 'pointer',
              }}
              onClick={() => { setSelectedRoute(r); setFreightMode(r.modes[0]); }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{r.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: selectedRoute.id === r.id ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                {r.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 8px' }}>
                {r.origin} → {r.destination}
              </div>
              <div className="flex gap-2">
                <span className="badge badge-blue">⏱ {r.transitDays}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>{r.notes}</div>
            </div>
          ))}
        </div>

        {/* Route Map */}
        <div
          style={{
            marginTop: 20,
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          <svg viewBox="0 0 900 250" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: 230, display: 'block' }}>
            <defs>
              <linearGradient id="logi-ocean" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="55%" stopColor="#e0eaff" />
                <stop offset="100%" stopColor="#cfe3ff" />
              </linearGradient>
              <linearGradient id="logi-land" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ede9fe" />
                <stop offset="100%" stopColor="#ddd6fe" />
              </linearGradient>
            </defs>

            {/* Ocean */}
            <rect width="900" height="250" fill="url(#logi-ocean)" />

            {/* Schematic landmasses */}
            <path d="M 0,185 C 60,150 150,170 260,135 C 370,100 470,95 585,120 C 700,145 790,120 900,95 L 900,250 L 0,250 Z" fill="url(#logi-land)" opacity="0.8" />
            <path d="M 35,40 C 90,10 150,35 195,18 C 230,4 275,14 300,38 C 275,70 210,85 150,70 C 100,58 60,62 35,40 Z" fill="url(#logi-land)" opacity="0.6" />
            <path d="M 640,30 C 700,8 760,20 800,8 C 845,-2 885,8 900,22 L 900,70 C 855,85 810,78 770,90 C 720,106 690,80 665,58 Z" fill="url(#logi-land)" opacity="0.65" />

            {/* Route path */}
            <g>
              <path d={route.map.line} stroke="#0ea5e9" strokeWidth="4" strokeDasharray="12 9" strokeLinecap="round" fill="none" opacity="0.35" />
              <path d={route.map.line} stroke="#0284c7" strokeWidth="3" strokeDasharray="12 9" strokeLinecap="round" fill="none" className="route-anim" />
            </g>

            {/* Port / city nodes */}
            {route.map.nodes.map((n, i) => (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r="16" fill="var(--color-surface)" stroke={i === 2 ? '#16a34a' : i === 0 ? '#dc2626' : '#0284c7'} strokeWidth="3" />
                {i === 0 && <circle cx={n.x} cy={n.y} r="26" fill="none" stroke="#dc2626" strokeWidth="1.5" className="route-ping" />}
                {i === 2 && <circle cx={n.x} cy={n.y} r="26" fill="none" stroke="#16a34a" strokeWidth="1.5" className="route-ping" />}
                <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="15">{n.flag}</text>
                <text x={n.x} y={n.y - 30} textAnchor="middle" fontSize="12" fontWeight="800" fill="#1e293b">{n.label}</text>
                <text x={n.x} y={n.y - 17} textAnchor="middle" fontSize="9" fill="#64748b">{n.sub}</text>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="flex" style={{ position: 'absolute', bottom: 8, left: 12, gap: 14, background: 'rgba(255,255,255,0.75)', padding: '4px 10px', borderRadius: 20, fontSize: 10, color: '#475569', fontWeight: 600, backdropFilter: 'blur(3px)' }}>
            <span>🗺️ Schematic route map</span>
            <span>⏱ {route.transitDays} transit</span>
          </div>
        </div>
      </div>

      {/* Step 2: Shipment Details */}
      <div className="card mb-4">
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>2 · Shipment Details</h2>
        <div className="form-grid">
          <div className="field">
            <label className="field-label">FOB Goods Value (USD)</label>
            <input className="input" type="number" value={goodsValue} onChange={e => setGoodsValue(e.target.value)} min="0" />
          </div>
          <div className="field">
            <label className="field-label">Weight (kg)</label>
            <input className="input" type="number" value={weight} onChange={e => setWeight(e.target.value)} min="0" />
          </div>
          <div className="field">
            <label className="field-label">Volume (CBM)</label>
            <input className="input" type="number" value={volume} onChange={e => setVolume(e.target.value)} min="0" step="0.1" />
          </div>
          <div className="field">
            <label className="field-label">Freight Mode</label>
            <select className="input" value={freightMode} onChange={e => setFreightMode(e.target.value)}>
              {route.modes.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Insurance Rate (%)</label>
            <input className="input" type="number" value={insuranceRate} onChange={e => setInsuranceRate(e.target.value)} step="0.1" min="0" max="5" />
          </div>
          <div className="field">
            <label className="field-label">HS Code (Ethiopian NBR)</label>
            <select className="input" value={hsInput} onChange={e => setHsInput(e.target.value)}>
              {hsEntries.map(([code, info]) => (
                <option key={code} value={code}>{code} — {info.description}</option>
              ))}
              <option value="custom">Other (0% demo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Step 3: Cost Breakdown */}
      <div className="card mb-4">
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>3 · Landed Cost Breakdown</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Cost breakdown table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Cost Component</th>
                  <th>Rate</th>
                  <th>Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>📦 FOB Goods Value</td>
                  <td>—</td>
                  <td style={{ fontWeight: 700 }}>{fmtUSD(fobValue)}</td>
                </tr>
                <tr>
                  <td>{route.icon} Freight Cost</td>
                  <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {route.baseCostPerCbm ? `$${route.baseCostPerCbm}/CBM` : `$${route.baseCostPerKg}/kg`}
                  </td>
                  <td>{fmtUSD(freightCost)}</td>
                </tr>
                <tr>
                  <td>🛡 Insurance ({insuranceRate}%)</td>
                  <td>{insuranceRate}%</td>
                  <td>{fmtUSD(insurance)}</td>
                </tr>
                <tr style={{ background: 'var(--color-surface-2)' }}>
                  <td style={{ fontWeight: 700 }}>CIF Value</td>
                  <td></td>
                  <td style={{ fontWeight: 800 }}>{fmtUSD(cif)}</td>
                </tr>
                {tariff && (
                  <>
                    <tr>
                      <td>🏛 Customs Duty ({tariff.dutyRate}%)</td>
                      <td>{tariff.dutyRate}%</td>
                      <td>{fmtUSD(tariff.customs)}</td>
                    </tr>
                    {tariff.exciseRate > 0 && (
                      <tr>
                        <td>⚡ Excise Tax ({tariff.exciseRate}%)</td>
                        <td>{tariff.exciseRate}%</td>
                        <td>{fmtUSD(tariff.excise)}</td>
                      </tr>
                    )}
                    <tr>
                      <td>🧾 VAT ({tariff.vatRate}%)</td>
                      <td>{tariff.vatRate}%</td>
                      <td>{fmtUSD(tariff.vat)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td>💼 ETHIO-BRIDGE Fee (2%)</td>
                  <td>2%</td>
                  <td>{fmtUSD(ethioFee)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: 'linear-gradient(90deg, #1e1b4b, #312e81)' }}>
                  <td style={{ fontWeight: 800, fontSize: 14, color: 'white' }}>🏆 Total Landed Cost</td>
                  <td></td>
                  <td style={{ fontWeight: 900, fontSize: 15, color: 'white' }}>{fmtUSD(landedCost + ethioFee)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="wallet-balance-card">
              <div className="wallet-label">Total Landed Cost</div>
              <div className="wallet-amount">{fmtUSD(landedCost + ethioFee)}</div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>≈ {fmtETB(landedCost + ethioFee)}</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>TRANSIT TIME</div>
                  <div style={{ fontWeight: 700 }}>{route.transitDays}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>ROUTE</div>
                  <div style={{ fontWeight: 700 }}>{route.icon} {route.label}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>📊 Cost Structure</div>
              {[
                { label: 'Goods Value', value: fobValue, color: '#4f46e5' },
                { label: 'Freight + Insurance', value: freightCost + insurance, color: '#0284c7' },
                { label: 'Import Duties + VAT', value: tariff?.total ?? 0, color: '#d97706' },
                { label: 'ETHIO-BRIDGE Fee', value: ethioFee, color: '#059669' },
              ].map(item => {
                const pct = landedCost + ethioFee > 0 ? (item.value / (landedCost + ethioFee)) * 100 : 0;
                return (
                  <div key={item.label} style={{ marginBottom: 10 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {tariff?.hasPermit && (
              <div className="alert alert-warning">
                ⚠️ This HS code requires an <strong>import permit</strong> from Ethiopian Ministry of Trade. Contact ETHIO-BRIDGE compliance advisors.
              </div>
            )}
          </div>
        </div>

        {/* Transit Timeline */}
        <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 13 }}>📅 Estimated Transit Timeline</div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {[
              { day: 'Day 1', event: '📋 Order Confirmed + ETHIO-BRIDGE Invoice', done: true },
              { day: 'Day 3', event: '🏭 Factory Production & Quality Check', done: true },
              { day: 'Day 7', event: `📦 ${route.icon} Cargo Loaded at Origin Port`, done: false },
              { day: `Day ${Math.round(route.transitTime * 0.6)}`, event: `🌊 In Transit — ${route.transit}`, done: false },
              { day: `Day ${route.transitTime}`, event: '🛃 Customs Clearance Ethiopia', done: false },
              { day: `Day ${route.transitTime + 5}`, event: '🏁 Delivery to Destination', done: false },
            ].map((step, i, arr) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 120 }}>
                <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: i === 0 ? '0' : '1', height: 2, background: step.done ? 'var(--color-success)' : 'var(--color-border)' }} />
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: step.done ? 'var(--color-success)' : 'var(--color-border)', flexShrink: 0 }} />
                  <div style={{ flex: i === arr.length - 1 ? '0' : '1', height: 2, background: step.done ? 'var(--color-success)' : 'var(--color-border)' }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: step.done ? 'var(--color-success)' : 'var(--text-tertiary)', marginTop: 4 }}>{step.day}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 2, maxWidth: 110, lineHeight: 1.3 }}>{step.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Request */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white', border: 'none' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>🌏 Ready to Start Your Cross-Border Trade?</div>
            <div style={{ opacity: 0.75, fontSize: 13 }}>
              ETHIO-BRIDGE connects you with verified Chinese suppliers. Platform fee: 2% on transaction value.
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/rfqs" className="btn btn-secondary">📋 Post RFQ</Link>
            <Link href="/products" className="btn" style={{ background: '#818cf8', color: 'white' }}>🛒 Browse Marketplace</Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
