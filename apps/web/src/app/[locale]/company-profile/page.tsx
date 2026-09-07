'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { api } from '@/lib/api';
import { getActiveOrganizationId } from '@/lib/auth';
import { useErrorMessage } from '@/components/error-message';
import { LANGUAGE_CODES } from '@/lib/languages';
import type { MyOrgEntry, OrganizationProfile } from '@/lib/types';

export default function CompanyProfilePage() {
  const t = useTranslations('company');
  const org = useTranslations('org');
  const message = useErrorMessage();
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const orgs = await api<MyOrgEntry[]>('/organizations/me');
      const orgEntry = orgs.find((o) => o.organization.id === getActiveOrganizationId()) ?? orgs[0];
      if (!orgEntry) {
        setError('');
        return;
      }
      const full = await api<OrganizationProfile>(`/organizations/${orgEntry.organization.id}`);
      setProfile(full);
      setForm({
        legalName: full.legalName ?? '',
        tradingName: full.tradingName ?? '',
        industry: full.industry ?? '',
        yearEstablished: full.yearEstablished ? String(full.yearEstablished) : '',
        description: full.description ?? '',
        country: full.country ?? '',
        region: full.region ?? '',
        city: full.city ?? '',
        address: full.address ?? '',
        phone: full.phone ?? '',
        email: full.email ?? '',
        website: full.website ?? '',
        registrationNumber: full.registrationNumber ?? '',
        tin: full.tin ?? '',
        preferredLanguage: full.preferredLanguage ?? 'en',
      });
    } catch (err) {
      setError(message(err));
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body: Record<string, string | number | undefined> = {
        legalName: form.legalName || undefined,
        tradingName: form.tradingName || undefined,
        industry: form.industry || undefined,
        yearEstablished: form.yearEstablished ? Number(form.yearEstablished) : undefined,
        description: form.description || undefined,
        country: form.country || undefined,
        region: form.region || undefined,
        city: form.city || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        registrationNumber: form.registrationNumber || undefined,
        tin: form.tin || undefined,
        preferredLanguage: form.preferredLanguage || undefined,
      };
      await api(`/organizations/${profile?.id}`, { method: 'PUT', body });
      setNotice(t('saved'));
      setEditing(false);
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  function row(label: string, value?: string | number | null) {
    return (
      <div className="kv">
        <dt>{label}</dt>
        <dd>{value ? String(value) : '—'}</dd>
      </div>
    );
  }

  return (
    <Shell orgName={profile?.legalName ?? null}>
      <div className="header-actions">
        <div>
          <h1>{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>
        {!editing ? (
          <button className="btn" type="button" onClick={() => setEditing(true)}>
            {t('editButton')}
          </button>
        ) : null}
      </div>
      {error ? <div className="error-text">{error}</div> : null}
      {notice ? <div className="notice-text">{notice}</div> : null}

      {!profile ? null : editing ? (
        <form className="card" onSubmit={save}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="p-legal">{org('legalNameLabel')} *</label>
              <input id="p-legal" required minLength={2} value={form.legalName}
                onChange={(e) => set('legalName', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-trading">{org('tradingNameLabel')}</label>
              <input id="p-trading" value={form.tradingName} onChange={(e) => set('tradingName', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-industry">{org('industryLabel')}</label>
              <input id="p-industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-year">{org('yearEstablishedLabel')}</label>
              <input id="p-year" type="number" min={1800} max={2100} value={form.yearEstablished}
                onChange={(e) => set('yearEstablished', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-country">{org('countryLabel')}</label>
              <input id="p-country" value={form.country} onChange={(e) => set('country', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-region">{org('regionLabel')}</label>
              <input id="p-region" value={form.region} onChange={(e) => set('region', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-city">{org('cityLabel')}</label>
              <input id="p-city" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-address">{org('addressLabel')}</label>
              <input id="p-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-phone">{org('phoneLabel')}</label>
              <input id="p-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-email">{org('emailLabel')}</label>
              <input id="p-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-website">{org('websiteLabel')}</label>
              <input id="p-website" value={form.website} onChange={(e) => set('website', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-regnum">{org('registrationNumberLabel')}</label>
              <input id="p-regnum" value={form.registrationNumber}
                onChange={(e) => set('registrationNumber', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-tin">{org('tinLabel')}</label>
              <input id="p-tin" value={form.tin} onChange={(e) => set('tin', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-lang">{org('preferredLanguageLabel')}</label>
              <select id="p-lang" value={form.preferredLanguage}
                onChange={(e) => set('preferredLanguage', e.target.value)}>
                {LANGUAGE_CODES.map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{org('businessTypeLabel')}</label>
              <input value={org(`businessTypes.${profile.businessType}`)} disabled readOnly />
              <div className="hint-text">{t('businessTypeFixed')}</div>
            </div>
            <div className="field field-wide">
              <label htmlFor="p-desc">{org('descriptionLabel')}</label>
              <textarea id="p-desc" rows={3} maxLength={2000} value={form.description}
                onChange={(e) => set('description', e.target.value)} />
            </div>
          </div>
          <div className="actions-row">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? '…' : t('saveButton')}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => { setEditing(false); load(); }}>
              {t('cancelEdit')}
            </button>
          </div>
        </form>
      ) : (
        <dl className="kv-list">
          {row(org('legalNameLabel'), profile.legalName)}
          {row(org('tradingNameLabel'), profile.tradingName)}
          {row(org('businessTypeLabel'), org(`businessTypes.${profile.businessType}`))}
          {row(org('industryLabel'), profile.industry)}
          {row(org('yearEstablishedLabel'), profile.yearEstablished)}
          {row(org('countryLabel'), profile.country)}
          {row(org('regionLabel'), profile.region)}
          {row(org('cityLabel'), profile.city)}
          {row(org('addressLabel'), profile.address)}
          {row(org('phoneLabel'), profile.phone)}
          {row(org('emailLabel'), profile.email)}
          {row(org('websiteLabel'), profile.website)}
          {row(org('registrationNumberLabel'), profile.registrationNumber)}
          {row(org('tinLabel'), profile.tin)}
          {row(org('preferredLanguageLabel'), profile.preferredLanguage)}
          {row('Verification', profile.verificationLevel)}
        </dl>
      )}
    </Shell>
  );
}