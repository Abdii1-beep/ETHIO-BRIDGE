'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { setActiveOrganizationId, storeSession } from '@/lib/auth';
import { useErrorMessage } from '@/components/error-message';
import type { LoginResult, MyOrgEntry, Profile } from '@/lib/types';
import PublicNav from '@/components/public/public-nav';
import PublicFooter from '@/components/public/public-footer';

interface RegisterResult {
  userId: string;
  devOtpCode?: string;
}

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const message = useErrorMessage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDevCode(null);
    try {
      const result = await api<RegisterResult & Partial<LoginResult>>('/auth/register', {
        method: 'POST',
        body: { name, email, phone: phone || undefined, password },
      });
      if (result.accessToken && result.refreshToken && result.user) {
        storeSession({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user as Profile,
        });
        const orgs = await api<MyOrgEntry[]>('/organizations/me');
        if (orgs.length === 0) {
          window.location.href = `/${locale}/create-organization`;
        } else {
          setActiveOrganizationId(orgs[0].organization.id);
          window.location.href = `/${locale}/dashboard`;
        }
        return;
      }
      if (result.devOtpCode) {
        setDevCode(result.devOtpCode);
      }
      window.location.href = `/${locale}/verify?email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PublicNav />
      <div className="container-narrow">
        <div className="card card-glass" style={{ textAlign: 'center', padding: '40px 32px', marginTop: '64px', width: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <img
              src="/logo.png"
              alt="ETHIO-BRIDGE"
              style={{ maxWidth: 120, maxHeight: 60, objectFit: 'contain', marginBottom: 16 }}
            />
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>{t('registerTitle')}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Join ETHIO-BRIDGE and start trading across borders
            </p>
          </div>
          
          <form onSubmit={onSubmit} style={{ textAlign: 'left' }}>
            <div className="field">
              <label htmlFor="name" className="field-label">{t('nameLabel')}</label>
              <input
                id="name"
                className="input"
                required
                minLength={2}
                autoComplete="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="email" className="field-label">{t('emailLabel')}</label>
              <input
                id="email"
                className="input"
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phone" className="field-label">{t('phoneLabel')}</label>
              <input
                id="phone"
                className="input"
                placeholder="Enter your phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password" className="field-label">{t('passwordLabel')}</label>
              <input
                id="password"
                className="input"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>{t('passwordHint')}</div>
            </div>
            {error ? (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            ) : null}
            {devCode ? (
              <div className="alert" style={{ marginBottom: 16, background: 'var(--color-warning-light)', color: 'var(--color-warning)', border: '1px solid var(--color-warning)' }}>
                <span>🔑</span>
                <span>{t('devCodeHint')} <strong>{devCode}</strong></span>
              </div>
            ) : null}
            <button 
              className="btn btn-primary" 
              type="submit" 
              disabled={busy}
              style={{ width: '100%', padding: '12px 24px', fontSize: 15 }}
            >
              {busy ? <span className="spinner"></span> : t('registerButton')}
            </button>
          </form>
          
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
              Already have an account?
            </p>
            <Link href="/login" className="btn btn-ghost" style={{ width: '100%' }}>
              {t('toLogin')}
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}