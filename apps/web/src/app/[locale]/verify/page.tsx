'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useErrorMessage } from '@/components/error-message';

function VerifyForm() {
  const t = useTranslations('auth');
  const message = useErrorMessage();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<{ verified: boolean }>('/auth/verify', {
        method: 'POST',
        body: { email, code: otp },
      });
      setSuccess(true);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    setBusy(true);
    setError(null);
    try {
      await api<{ sent: boolean; devOtpCode?: string }>('/auth/resend-otp', {
        method: 'POST',
        body: { email },
      });
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="card">
        <p>{t('verifySuccess')}</p>
        <Link href="/login" className="btn">
          {t('goToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>{t('verifyTitle')}</h1>
      <p style={{ color: '#61708b', fontSize: 14 }}>{email}</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="otp">OTP</label>
          <input id="otp" required value={otp} onChange={(e) => setOtp(e.target.value)} />
        </div>
        {error ? <div className="error-text">{error}</div> : null}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? '…' : t('verifyButton')}
        </button>{' '}
        <button className="btn btn-ghost" type="button" disabled={busy} onClick={onResend}>
          {t('resendButton')}
        </button>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="container-narrow">
      <Suspense>
        <VerifyForm />
      </Suspense>
    </div>
  );
}