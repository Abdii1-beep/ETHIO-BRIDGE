'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { useErrorMessage } from '@/components/error-message';
import { api } from '@/lib/api';
import type { Branch, Department } from '@/lib/types';

interface BranchDraft {
  kind: 'branch';
  id: string | null;
  name: string;
  city: string;
  address: string;
}

interface DepartmentDraft {
  kind: 'department';
  id: string | null;
  name: string;
  description: string;
}

type Draft = BranchDraft | DepartmentDraft;

export default function BranchesPage() {
  const bt = useTranslations('branchesPage');
  const message = useErrorMessage();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, d] = await Promise.all([api<Branch[]>('/branches'), api<Department[]>('/departments')]);
      setBranches(b);
      setDepartments(d);
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const statusLabel = (isActive: boolean) => (isActive ? bt('active') : bt('inactive'));

  const isBranch = (entry: Branch | Department): entry is Branch => Object.prototype.hasOwnProperty.call(entry, 'city');

  function newDraft(kind: 'branch' | 'department'): Draft {
    return kind === 'branch'
      ? { kind, id: null, name: '', city: '', address: '' }
      : { kind, id: null, name: '', description: '' };
  }

  function startEdit(entry: Branch | Department) {
    if (isBranch(entry)) {
      setDraft({ kind: 'branch', id: entry.id, name: entry.name, city: entry.city ?? '', address: entry.address ?? '' });
    } else {
      setDraft({ kind: 'department', id: entry.id, name: entry.name, description: entry.description ?? '' });
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const body =
        draft.kind === 'branch'
          ? { name: draft.name, city: draft.city || undefined, address: draft.address || undefined }
          : { name: draft.name, description: draft.description || undefined };
      if (draft.id) {
        await api(draft.kind === 'branch' ? `/branches/${draft.id}` : `/departments/${draft.id}`, {
          method: 'PUT',
          body,
        });
      } else {
        await api(draft.kind === 'branch' ? '/branches' : '/departments', { method: 'POST', body });
      }
      setNotice(bt('saved'));
      setDraft(null);
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: Branch | Department) {
    setError(null);
    setNotice(null);
    try {
      await api(
        ('city' in entry && !('description' in entry) ? '/branches/' : '/departments/') + entry.id,
        { method: 'DELETE' },
      );
      setNotice(bt('deleted'));
      await load();
    } catch (err) {
      setError(message(err));
    }
  }

  return (
    <Shell>
      <div className="header-actions">
        <div>
          <h1>{bt('title')}</h1>
        </div>
        <button className="btn" type="button" onClick={() => setDraft(newDraft('branch'))}>
          {bt('addBranch')}
        </button>
        <button className="btn" type="button" onClick={() => setDraft(newDraft('department'))}>
          {bt('addDepartment')}
        </button>
      </div>

      {busy ? <p className="empty">…</p> : null}
      {error ? <div className="error-text">{error}</div> : null}
      {notice ? <div className="notice-text">{notice}</div> : null}

      {draft ? (
        <div className="card form-card">
          <form onSubmit={save}>
            <div className="form-grid">
              {draft.kind === 'branch' ? (
                <>
                  <div className="field">
                    <label>{bt('name')} *</label>
                    <input required minLength={2} maxLength={200} value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label>{bt('city')}</label>
                    <input maxLength={120} value={draft.city}
                      onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                  </div>
                  <div className="field field-wide">
                    <label>{bt('address')}</label>
                    <input maxLength={300} value={draft.address}
                      onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <label>{bt('name')} *</label>
                    <input required minLength={2} maxLength={200} value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  </div>
                  <div className="field field-wide">
                    <label>{bt('description')}</label>
                    <input maxLength={500} value={draft.description}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                  </div>
                </>
              )}
            </div>
            <div className="actions-row">
              <button className="btn" type="submit" disabled={saving}>
                {saving ? '…' : bt('save')}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>
                {bt('cancel')}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <h2>{bt('branchesTitle')}</h2>
      {branches && branches.length === 0 ? (
        <p className="empty">{bt('branchesEmpty')}</p>
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>{bt('name')}</th>
              <th>{bt('city')}</th>
              <th>{bt('address')}</th>
              <th>{bt('active')} / {bt('inactive')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(branches ?? []).map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.city ?? '—'}</td>
                <td>{b.address ?? '—'}</td>
                <td>
                  <span className={b.isActive ? 'badge badge-active' : 'badge badge-planned'}>
                    {statusLabel(b.isActive)}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn-link" type="button" onClick={() => startEdit(b)}>
                      {bt('edit')}
                    </button>
                    <button className="btn-link danger" type="button" onClick={() => remove(b)}>
                      {bt('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>{bt('departmentsTitle')}</h2>
      {departments && departments.length === 0 ? (
        <p className="empty">{bt('departmentsEmpty')}</p>
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>{bt('name')}</th>
              <th>{bt('description')}</th>
              <th>{bt('active')} / {bt('inactive')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(departments ?? []).map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.description ?? '—'}</td>
                <td>
                  <span className={d.isActive ? 'badge badge-active' : 'badge badge-planned'}>
                    {statusLabel(d.isActive)}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn-link" type="button" onClick={() => startEdit(d)}>
                      {bt('edit')}
                    </button>
                    <button className="btn-link danger" type="button" onClick={() => remove(d)}>
                      {bt('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  );
}