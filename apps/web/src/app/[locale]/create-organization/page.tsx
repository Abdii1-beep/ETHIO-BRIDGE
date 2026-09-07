'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getAccessToken, setActiveOrganizationId } from '@/lib/auth';
import { useErrorMessage } from '@/components/error-message';

const BUSINESS_TYPES = [
  { value: 'PRIVATE_COMPANY', label: 'Private Limited Company (PLC)' },
  { value: 'PLC', label: 'Public Limited Company' },
  { value: 'SME', label: 'Small & Medium Enterprise (SME)' },
  { value: 'IMPORTER', label: 'Importer' },
  { value: 'EXPORTER', label: 'Exporter' },
  { value: 'TRADER', label: 'Trader / Wholesaler' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
  { value: 'COOPERATIVE', label: 'Cooperative' },
  { value: 'NGO', label: 'NGO / Non-profit' },
  { value: 'OTHER', label: 'Other' },
];

export default function CreateOrganizationPage() {
  const t = useTranslations('org');
  const locale = useLocale();
  const router = useRouter();
  const message = useErrorMessage();
  const token = getAccessToken();

  const [form, setForm] = useState({
    legalName: '',
    tradingName: '',
    businessType: 'IMPORTER',
    country: 'ET',
    city: '',
    preferredLanguage: locale,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setError('You must be signed in to create an organization. Please sign in first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = await api<{ id?: string; organization?: { id: string } }>('/organizations', {
        method: 'POST',
        body: form,
      });
      const orgId = payload?.organization?.id || payload?.id;
      if (orgId) {
        setActiveOrganizationId(orgId);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ padding: '32px 16px' }}>
      <div className="card" style={{ maxWidth: 640, margin: '0 auto', padding: '32px' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>{t('createTitle')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          {t('createSubtitle')}
        </p>

        {!token && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>⚠️ Please sign in first before registering your company organization.</span>
            <Link href="/login" className="btn btn-sm btn-primary" style={{ textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="legalName" style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              {t('legalNameLabel')} *
            </label>
            <input
              id="legalName"
              className="input"
              style={{ width: '100%' }}
              required
              minLength={2}
              placeholder="e.g. Ermi Car Exporter PLC"
              value={form.legalName}
              onChange={(e) => set('legalName', e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="tradingName" style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              {t('tradingNameLabel')}
            </label>
            <input
              id="tradingName"
              className="input"
              style={{ width: '100%' }}
              placeholder="e.g. Ermi Car"
              value={form.tradingName}
              onChange={(e) => set('tradingName', e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="businessType" style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              {t('businessTypeLabel')} *
            </label>
            <select
              id="businessType"
              className="input"
              style={{ width: '100%' }}
              value={form.businessType}
              onChange={(e) => set('businessType', e.target.value)}
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>
                  {bt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="country" style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              {t('countryLabel')} *
            </label>
            <select
              id="country"
              className="input"
              style={{ width: '100%' }}
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
            >
              <option value="ET">🇪🇹 Ethiopia</option>
              <option value="CN">🇨🇳 China</option>
              <option value="IN">🇮🇳 India</option>
              <option value="AE">🇦🇪 United Arab Emirates</option>
            </select>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="city" style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              {t('cityLabel')}
            </label>
            <input
              id="city"
              className="input"
              style={{ width: '100%' }}
              placeholder="e.g. Addis Ababa or Beijing"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: 24 }}>
            <label htmlFor="preferredLanguage" style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
              {t('preferredLanguageLabel')}
            </label>
            <select
              id="preferredLanguage"
              className="input"
              style={{ width: '100%' }}
              value={form.preferredLanguage}
              onChange={(e) => set('preferredLanguage', e.target.value)}
            >
              <option value="en">English</option>
              <option value="am">አማርኛ (Amharic)</option>
              <option value="om">Afaan Oromoo (Oromo)</option>
              <option value="zh">中文 (Chinese)</option>
            </select>
          </div>

          {error ? (
            <div className="error-text" style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {error}
            </div>
          ) : null}

          <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', padding: '10px 16px' }}>
            {busy ? 'Creating Organization…' : t('createButton')}
          </button>
        </form>
      </div>
    </div>
  );
}