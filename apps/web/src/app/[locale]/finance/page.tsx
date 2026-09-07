'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { api } from '@/lib/api';
import { getActiveOrganizationId } from '@/lib/auth';
import { useErrorMessage } from '@/components/error-message';
import type {
  ChartAccount,
  FinanceSummary,
  FinanceTransaction,
  MyOrgEntry,
  TransactionsPayload,
} from '@/lib/types';

const CURRENCIES = ['ETB', 'USD', 'CNY', 'EUR', 'GBP'] as const;
const TX_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER', 'PAYMENT', 'RECEIPT'] as const;
const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as const;

const fmt = (value: string | number) =>
  Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function FinancePage() {
  const t = useTranslations('finance');
  const message = useErrorMessage();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [txs, setTxs] = useState<TransactionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [acc, setAcc] = useState({ code: '', name: '', type: 'ASSET' as const, parentId: '', description: '' });
  const [showTxForm, setShowTxForm] = useState(false);
  const [tx, setTx] = useState({
    type: 'INCOME' as (typeof TX_TYPES)[number] | '',
    amount: '',
    currency: 'ETB' as string,
    accountId: '',
    occurredAt: '',
    description: '',
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [orgs, s, acs, txsData] = await Promise.all([
        api<MyOrgEntry[]>('/organizations/me'),
        api<FinanceSummary>('/transactions/summary'),
        api<ChartAccount[]>('/transactions/accounts'),
        api<TransactionsPayload>('/transactions?limit=50'),
      ]);
      const org = orgs.find((o) => o.organization.id === getActiveOrganizationId()) ?? orgs[0];
      setOrgName(org?.organization.legalName ?? null);
      setSummary(s);
      setAccounts(acs);
      setTxs(txsData);
    } catch (err) {
      setError(message(err));
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api('/transactions/accounts', {
        method: 'POST',
        body: {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          parentId: acc.parentId || undefined,
          description: acc.description || undefined,
        },
      });
      setAcc({ code: '', name: '', type: 'ASSET', parentId: '', description: '' });
      setShowAccountForm(false);
      setNotice(t('accountCreated'));
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function setAccountActive(account: ChartAccount, isActive: boolean) {
    setError(null);
    try {
      await api(`/transactions/accounts/${account.id}`, {
        method: 'PUT',
        body: { isActive: String(isActive) },
      });
      await load();
    } catch (err) {
      setError(message(err));
    }
  }

  async function createTransaction(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await api('/transactions', {
        method: 'POST',
        body: {
          type: tx.type,
          amount: Number(tx.amount),
          currency: tx.currency,
          accountId: tx.accountId || undefined,
          occurredAt: tx.occurredAt || undefined,
          description: tx.description,
        },
      });
      setTx({ type: 'INCOME', amount: '', currency: 'ETB', accountId: '', occurredAt: '', description: '' });
      setShowTxForm(false);
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function deleteTransaction(id: string) {
    setError(null);
    setNotice(null);
    try {
      await api(`/transactions/${id}`, { method: 'DELETE' });
      setNotice(t('deleted'));
      await load();
    } catch (err) {
      setError(message(err));
    }
  }

  return (
    <Shell orgName={orgName}>
      <h1>{t('title')}</h1>
      <p className="subtitle">{t('subtitle')}</p>
      {error ? <div className="error-text">{error}</div> : null}
      {notice ? <div className="notice-text">{notice}</div> : null}

      {summary ? (
        <section className="section">
          <h2>{t('overviewTitle')}</h2>
          <div className="kpi-grid" style={{ marginBottom: 24 }}>
            <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-light)', '--kpi-color': 'var(--color-success)' } as any}>
              <div className="kpi-icon">💰</div>
              <div className="kpi-label">{t('incoming')}</div>
              <div className="kpi-value">{fmt(summary.incoming)}</div>
              <div className="kpi-sub">{summary.currency}</div>
            </div>
            <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-danger)', '--kpi-bg': 'var(--color-danger-light)', '--kpi-color': 'var(--color-danger)' } as any}>
              <div className="kpi-icon">💸</div>
              <div className="kpi-label">{t('outgoing')}</div>
              <div className="kpi-value">{fmt(summary.outgoing)}</div>
              <div className="kpi-sub">{summary.currency}</div>
            </div>
            <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-primary)', '--kpi-bg': 'var(--color-primary-light)', '--kpi-color': 'var(--color-primary)' } as any}>
              <div className="kpi-icon">📊</div>
              <div className="kpi-label">{t('net')}</div>
              <div className="kpi-value">{fmt(summary.net)}</div>
              <div className="kpi-sub">{summary.currency}</div>
            </div>
            <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-info)', '--kpi-bg': 'var(--color-info-light)', '--kpi-color': 'var(--color-info)' } as any}>
              <div className="kpi-icon">📈</div>
              <div className="kpi-label">{t('transactionCount')}</div>
              <div className="kpi-value">{summary.transactionCount}</div>
              <div className="kpi-sub">{t('accountCount') + ': ' + summary.accountCount}</div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="header-actions">
          <div>
            <h2>{t('accountsTitle')}</h2>
            <p className="subtitle">{t('accountsSubtitle')}</p>
          </div>
          <button className="btn" type="button" onClick={() => setShowAccountForm((v) => !v)}>
            {t('createAccount')}
          </button>
        </div>

        {showAccountForm ? (
          <div className="card form-card">
            <form onSubmit={createAccount}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="acc-code">{t('code')}</label>
                  <input id="acc-code" required maxLength={20} value={acc.code} placeholder="1000"
                    onChange={(e) => setAcc((p) => ({ ...p, code: e.target.value }))} />
                </div>
                <div className="field">
                  <label htmlFor="acc-name">{t('name')}</label>
                  <input id="acc-name" required maxLength={200} value={acc.name}
                    onChange={(e) => setAcc((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label htmlFor="acc-type">{t('type')}</label>
                  <select id="acc-type" value={acc.type}
                    onChange={(e) => setAcc((p) => ({ ...p, type: e.target.value as typeof acc.type }))}>
                    {ACCOUNT_TYPES.map((c) => (
                      <option key={c} value={c}>{t(`accountTypes.${c}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="acc-parent">{t('parent')}</label>
                  <select id="acc-parent" value={acc.parentId}
                    onChange={(e) => setAcc((p) => ({ ...p, parentId: e.target.value }))}>
                    <option value="">{t('parentNone')}</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field field-wide">
                  <label htmlFor="acc-desc">{t('description')}</label>
                  <input id="acc-desc" maxLength={500} value={acc.description}
                    onChange={(e) => setAcc((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="field-wide hint-text">{t('accountCodeHint')}</div>
              </div>
              <div className="actions-row">
                <button className="btn" type="submit" disabled={busy}>
                  {busy ? '…' : t('createAccount')}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {accounts.length === 0 ? (
          <div className="empty">{t('noAccounts')}</div>
        ) : (
          <table className="list">
            <thead>
              <tr>
                <th>{t('code')}</th>
                <th>{t('name')}</th>
                <th>{t('type')}</th>
                <th>{t('parent')}</th>
                <th>{t('transactionCount')}</th>
                <th>{t('active')}</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td>{a.code}</td>
                  <td>{a.name}</td>
                  <td>{t(`accountTypes.${a.type}`)}</td>
                  <td>{a.parent ? `${a.parent.code} · ${a.parent.name}` : '—'}</td>
                  <td>{a._count?.transactions ?? 0}</td>
                  <td>
                    {a.isActive ? (
                      <button className="btn-link" type="button" onClick={() => setAccountActive(a, false)}>
                        <span className="badge badge-active">{t('active')}</span>
                      </button>
                    ) : (
                      <button className="btn-link" type="button" onClick={() => setAccountActive(a, true)}>
                        <span className="badge badge-planned">{t('inactive')}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="section">
        <div className="header-actions">
          <div>
            <h2>{t('transactionsTitle')}</h2>
          </div>
          <button className="btn" type="button" onClick={() => setShowTxForm((v) => !v)}>
            {t('addTransaction')}
          </button>
        </div>

        {showTxForm ? (
          <div className="card form-card">
            <form onSubmit={createTransaction}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="tx-type">{t('type')}</label>
                  <select id="tx-type" required value={tx.type}
                    onChange={(e) => setTx((p) => ({ ...p, type: e.target.value as typeof tx.type }))}>
                    {TX_TYPES.map((c) => (
                      <option key={c} value={c}>{t(`transactionTypes.${c}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="tx-amount">{t('amount')}</label>
                  <input id="tx-amount" required type="number" step="0.01" min="0.01" value={tx.amount}
                    onChange={(e) => setTx((p) => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="field">
                  <label htmlFor="tx-currency">{t('currency')}</label>
                  <select id="tx-currency" value={tx.currency}
                    onChange={(e) => setTx((p) => ({ ...p, currency: e.target.value }))}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="tx-account">{t('account')}</label>
                  <select id="tx-account" value={tx.accountId}
                    onChange={(e) => setTx((p) => ({ ...p, accountId: e.target.value }))}>
                    <option value="">—</option>
                    {accounts.filter((a) => a.isActive).map((a) => (
                      <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="tx-date">{t('occurredAt')}</label>
                  <input id="tx-date" type="date"
                    value={tx.occurredAt}
                    onChange={(e) => setTx((p) => ({ ...p, occurredAt: e.target.value }))} />
                </div>
                <div className="field field-wide">
                  <label htmlFor="tx-desc">{t('description')}</label>
                  <input id="tx-desc" required maxLength={2000} value={tx.description}
                    onChange={(e) => setTx((p) => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="actions-row">
                <button className="btn" type="submit" disabled={busy}>
                  {busy ? '…' : t('addTransaction')}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {!txs || txs.items.length === 0 ? (
          <div className="empty">{t('noTransactions')}</div>
        ) : (
          <table className="list">
            <thead>
              <tr>
                <th>{t('occurredAt')}</th>
                <th>{t('type')}</th>
                <th>{t('description')}</th>
                <th>{t('account')}</th>
                <th>{t('amount')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {txs.items.map((txn) => (
                <tr key={txn.id}>
                  <td>{new Date(txn.occurredAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${txn.type === 'EXPENSE' || txn.type === 'PAYMENT' ? 'badge-planned' : 'badge-active'}`}>
                      {t(`transactionTypes.${txn.type}`)}
                    </span>
                  </td>
                  <td>{txn.description}</td>
                  <td>{txn.account ? `${txn.account.code} · ${txn.account.name}` : '—'}</td>
                  <td>{fmt(txn.amount)} {txn.currency}</td>
                  <td>
                    <button className="btn-link" type="button" onClick={() => deleteTransaction(txn.id)}>
                      {t('deleteTransaction')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Shell>
  );
}