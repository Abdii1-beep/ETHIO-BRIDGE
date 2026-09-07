'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { useErrorMessage } from '@/components/error-message';
import { api } from '@/lib/api';
import { getActiveOrganizationId } from '@/lib/auth';
import { initials, formatDate } from '@/lib/format';
import type { MembersPayload, MyOrgEntry, RoleRow } from '@/lib/types';

type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING';

export default function TeamPage() {
  const tt = useTranslations('team');
  const message = useErrorMessage();
  const [data, setData] = useState<MembersPayload | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', roleId: '' });
  const [saving, setSaving] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [payload, roleRows, orgs] = await Promise.all([
        api<MembersPayload>('/users'),
        api<RoleRow[]>('/roles'),
        api<MyOrgEntry[]>('/organizations/me'),
      ]);
      const org = orgs.find((o) => o.organization.id === getActiveOrganizationId()) ?? orgs[0];
      setOrgName(org?.organization.legalName ?? null);
      setData(payload);
      setRoles(roleRows);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.members.filter((m) => {
      if (filter !== 'ALL' && m.status !== filter) return false;
      if (!q) return true;
      return (
        m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q)
      );
    });
  }, [data, search, filter]);

  const memberCount = (s: StatusFilter) =>
    data ? data.members.filter((m) => s === 'ALL' || m.status === s).length : 0;

  async function inviteUser(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api('/users/invite', {
        method: 'POST',
        body: {
          email: invite.email,
          name: invite.name || undefined,
          roleId: invite.roleId || undefined,
        },
      });
      setNotice(tt('invited', { email: invite.email }));
      setInvite({ name: '', email: '', roleId: '' });
      setShowInvite(false);
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setSaving(false);
    }
  }

  async function assignRole(memberId: string) {
    setAssigningId(memberId);
    setError(null);
    setNotice(null);
    const selected = (document.getElementById(`role-select-${memberId}`) as HTMLSelectElement)?.value ?? '';
    try {
      await api(`/users/${memberId}`, { method: 'PUT', body: { roleIds: selected ? [selected] : [] } });
      setNotice(tt('inviteRole') + ' ✓');
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setAssigningId(null);
    }
  }

  const statusKey = (status: string) => (status === 'ACTIVE' ? 'statusActive' : 'statusPending');

  return (
    <Shell orgName={orgName}>
      <div className="header-actions">
        <div>
          <h1>{tt('title')}</h1>
          <p style={{ color: '#61708b' }}>{tt('subtitle', { org: orgName ?? '' })}</p>
        </div>
        <input
          className="search-input"
          type="search"
          placeholder={tt('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn" type="button" onClick={() => setShowInvite((v) => !v)}>
          {tt('inviteTitle')}
        </button>
      </div>

      {/* Team Statistics */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-primary)', '--kpi-bg': 'var(--color-primary-light)', '--kpi-color': 'var(--color-primary)' } as any}>
          <div className="kpi-icon">👥</div>
          <div className="kpi-label">Total Members</div>
          <div className="kpi-value">{data?.members.length || 0}</div>
          <div className="kpi-sub">Active team</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-success)', '--kpi-bg': 'var(--color-success-light)', '--kpi-color': 'var(--color-success)' } as any}>
          <div className="kpi-icon">✅</div>
          <div className="kpi-label">Active Members</div>
          <div className="kpi-value">{memberCount('ACTIVE')}</div>
          <div className="kpi-sub">Currently active</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-warning)', '--kpi-bg': 'var(--color-warning-light)', '--kpi-color': 'var(--color-warning)' } as any}>
          <div className="kpi-icon">⏳</div>
          <div className="kpi-label">Pending</div>
          <div className="kpi-value">{memberCount('PENDING')}</div>
          <div className="kpi-sub">Awaiting acceptance</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'var(--color-info)', '--kpi-bg': 'var(--color-info-light)', '--kpi-color': 'var(--color-info)' } as any}>
          <div className="kpi-icon">📨</div>
          <div className="kpi-label">Invitations</div>
          <div className="kpi-value">{data?.invitations.length || 0}</div>
          <div className="kpi-sub">Pending invites</div>
        </div>
      </div>

      {busy ? <p className="empty">…</p> : null}
      {error ? <div className="error-text">{error}</div> : null}
      {notice ? <div className="notice-text">{notice}</div> : null}

      <div className="tabs">
        {(['ALL', 'ACTIVE', 'PENDING'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`tab${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'ALL' ? tt('filterAll') : tt(statusKey(s))}
            <span className="tab-count">{memberCount(s)}</span>
          </button>
        ))}
      </div>

      {showInvite ? (
        <div className="card form-card">
          <form onSubmit={inviteUser}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="inv-name">{tt('inviteName')}</label>
                <input id="inv-name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="inv-email">{tt('inviteEmail')} *</label>
                <input id="inv-email" type="email" required value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="inv-role">{tt('inviteRole')}</label>
                <select id="inv-role" value={invite.roleId}
                  onChange={(e) => setInvite({ ...invite, roleId: e.target.value })}>
                  <option value="">{tt('noRole')}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="hint-text">{tt('inviteNote')}</div>
            <div className="actions-row">
              <button className="btn" type="submit" disabled={saving}>
                {saving ? '…' : tt('inviteButton')}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {data ? (
        <>
          <h2>{tt('membersTitle')}</h2>
          {filteredMembers.length === 0 ? (
            <p className="empty">{search || filter !== 'ALL' ? tt('noResults') : tt('empty')}</p>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>{tt('name')}</th>
                  <th>{tt('email')}</th>
                  <th>{tt('role')}</th>
                  <th>{tt('status')}</th>
                  <th>{tt('joined')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="avatar">{initials(m.user.name)}</span>{' '}
                      <span>{m.user.name}</span>
                    </td>
                    <td>{m.user.email}</td>
                    <td>
                      {m.roleAssignments.length > 0 ? (
                        <span className="perm-chip">{m.roleAssignments.map((a) => a.role.name).join(', ')}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${m.status === 'ACTIVE' ? 'badge-active' : 'badge-planned'}`}>
                        {tt(statusKey(m.status))}
                      </span>
                    </td>
                    <td>{formatDate(m.joinedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <select
                          id={`role-select-${m.id}`}
                          className="role-select"
                          defaultValue={m.roleAssignments[0]?.role.id ?? ''}
                        >
                          <option value="">{tt('noRole')}</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <button className="btn-link" type="button" disabled={assigningId === m.id}
                          onClick={() => assignRole(m.id)}>
                          {assigningId === m.id ? '…' : tt('assignRole')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>{tt('invitationsTitle')}</h2>
          {data.invitations.length === 0 ? (
            <p className="empty">{tt('empty')}</p>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>{tt('name')}</th>
                  <th>{tt('email')}</th>
                  <th>{tt('status')}</th>
                  <th>{tt('joined')}</th>
                </tr>
              </thead>
              <tbody>
                {data.invitations.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.name ?? '—'}</td>
                    <td>{inv.email}</td>
                    <td>
                      <span className="badge badge-planned">{inv.status}</span>
                    </td>
                    <td>{formatDate(inv.invitedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : null}
    </Shell>
  );
}