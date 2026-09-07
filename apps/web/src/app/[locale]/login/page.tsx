'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { setActiveOrganizationId, storeSession, clearSession } from '@/lib/auth';
import { useErrorMessage } from '@/components/error-message';
import type { LoginResult, MyOrgEntry } from '@/lib/types';
import PublicNav from '@/components/public/public-nav';
import PublicFooter from '@/components/public/public-footer';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const message = useErrorMessage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Clear any existing session when login page loads
  useEffect(() => {
    clearSession();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await api<LoginResult>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      storeSession(session);

      const orgs = await api<MyOrgEntry[]>('/organizations/me');
      if (orgs.length === 0) {
        router.push('/create-organization');
      } else {
        setActiveOrganizationId(orgs[0].organization.id);
        router.push('/dashboard');
      }
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
        <div className="card card-glass" style={{ textAlign: 'center', padding: '40px 32px', marginTop: '64px', width: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <img
              src="/logo.png"
              alt="ETHIO-BRIDGE"
              style={{ maxWidth: 120, maxHeight: 60, objectFit: 'contain', marginBottom: 16 }}
            />
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>{t('loginTitle')}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {t('loginSubtitle')}
            </p>
          </div>
          
          <form onSubmit={onSubmit} style={{ textAlign: 'left' }}>
            <div className="field">
              <label htmlFor="email" className="field-label">{t('emailLabel')}</label>
              <input
                id="email"
                type="email"
                className="input"
                required
                autoComplete="username"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password" className="field-label">{t('passwordLabel')}</label>
              <input
                id="password"
                type="password"
                className="input"
                required
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            ) : null}
            <button 
              className="btn btn-primary" 
              type="submit" 
              disabled={busy}
              style={{ width: '100%', padding: '12px 24px', fontSize: 15 }}
            >
              {busy ? <span className="spinner"></span> : t('loginButton')}
            </button>
          </form>
          
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>
              {t('noAccount')}
            </p>
            <Link href="/register" className="btn btn-ghost" style={{ width: '100%' }}>
              {t('toRegister')}
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}