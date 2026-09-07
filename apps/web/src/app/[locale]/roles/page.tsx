'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { api } from '@/lib/api';
import { getActiveOrganizationId } from '@/lib/auth';
import { useErrorMessage } from '@/components/error-message';
import { initials } from '@/lib/format';
import type { MyOrgEntry, PermissionGroup, RoleRow } from '@/lib/types';

interface RoleDetail {
  id: string;
  name: string;
  description?: string | null;
  isBuiltIn: boolean;
  permissions: Array<{ permission: { code: string; category: string; nameKey: string } }>;
  memberRoles: Array<{
    member: { id: string; user: { name: string; email: string } };
  }>;
}

interface RoleDraft {
  id: string | null;
  name: string;
  description: string;
  permissionCodes: string[];
}

const EMPTY_DRAFT: RoleDraft = { id: null, name: '', description: '', permissionCodes: [] };

export default function RolesPage() {
  const t = useTranslations('roles');
  const perm = useTranslations('permission');
  const message = useErrorMessage();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [catalog, setCatalog] = useState<PermissionGroup[]>([]);
  const [detail, setDetail] = useState<RoleDetail | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [editing, setEditing] = useState<RoleDraft | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [orgs, roleRows, groups] = await Promise.all([
        api<MyOrgEntry[]>('/organizations/me'),
        api<RoleRow[]>('/roles'),
        api<PermissionGroup[]>('/roles/permissions'),
      ]);
      const org = orgs.find((o) => o.organization.id === getActiveOrganizationId()) ?? orgs[0];
      setOrgName(org?.organization.legalName ?? null);
      setRoles(roleRows);
      setCatalog(groups);
    } catch (err) {
      setError(message(err));
    }
  }, [message]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q),
    );
  }, [roles, search]);

  const totalPermissions = useMemo(
    () => catalog.reduce((acc, g) => acc + g.permissions.length, 0),
    [catalog],
  );

  const codesByGroup = useMemo(
    () => new Map(catalog.map((g) => [g.category, new Set(g.permissions.map((p) => p.code))])),
    [catalog],
  );

  async function toggleDetail(role: RoleRow) {
    setNotice(null);
    setError(null);
    if (detail?.id === role.id) {
      setDetail(null);
      return;
    }
    setDetailBusy(true);
    try {
      const got = await api<RoleDetail>(`/roles/${role.id}`);
      setDetail(got);
    } catch (err) {
      setError(message(err));
    } finally {
      setDetailBusy(false);
    }
  }

  function toggle(code: string) {
    if (!editing) return;
    const next = new Set(editing.permissionCodes);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setEditing({ ...editing, permissionCodes: [...next] });
  }

  function toggleGroup(category: string, codes: Set<string>) {
    if (!editing) return;
    const next = new Set(editing.permissionCodes);
    const allSelected = codes.size > 0 && [...codes].every((c) => next.has(c));
    if (allSelected) codes.forEach((c) => next.delete(c));
    else codes.forEach((c) => next.add(c));
    setEditing({ ...editing, permissionCodes: [...next] });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = {
        name: editing.name,
        description: editing.description || undefined,
        permissionCodes: editing.permissionCodes,
      };
      if (editing.id) {
        await api(`/roles/${editing.id}`, { method: 'PUT', body });
      } else {
        await api('/roles', { method: 'POST', body });
      }
      setNotice(t('saved'));
      setEditing(null);
      setDetail(null);
      await load();
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeRole(role: RoleRow) {
    setError(null);
    setNotice(null);
    try {
      await api(`/roles/${role.id}`, { method: 'DELETE' });
      setNotice(t('deleted'));
      if (detail?.id === role.id) setDetail(null);
      await load();
    } catch (err) {
      setError(message(err));
    }
  }

  function startEdit(role: RoleRow) {
    setEditing({
      id: role.id,
      name: role.name,
      description: role.description ?? '',
      permissionCodes: role.permissions.map((p) => p.permission.code),
    });
  }

  const groupedDetailChips = useMemo(() => {
    if (!detail) return [];
    return catalog
      .map((g) => ({
        category: g.category,
        codes: g.permissions
          .filter((p) => detail.permissions.some((rp) => rp.permission.code === p.code))
          .map((p) => p.code),
      }))
      .filter((g) => g.codes.length > 0);
  }, [detail, catalog]);

  return (
    <Shell orgName={orgName}>
      <div className="header-actions">
        <div>
          <h1>{t('title')}</h1>
          <p className="subtitle">{t('subtitle')}</p>
        </div>
        <input
          className="search-input"
          type="search"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn" type="button" onClick={() => setEditing(EMPTY_DRAFT)}>
          {t('createRole')}
        </button>
      </div>
      {error ? <div className="error-text">{error}</div> : null}
      {notice ? <div className="notice-text">{notice}</div> : null}

      {filtered.length === 0 ? (
        <p className="empty">{search ? t('noResults') : t('empty')}</p>
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>{t('nameLabel')}</th>
              <th>{t('builtIn')}</th>
              <th>{t('permissionsLabel')}</th>
              <th>{t('members')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((role) => (
              <Fragment key={role.id}>
                <tr>
                  <td>
                    <button
                      className="btn-link"
                      type="button"
                      onClick={() => toggleDetail(role)}
                      title={detail?.id === role.id ? t('collapse') : t('details')}
                    >
                      {role.name}
                    </button>
                    {role.description ? (
                      <div className="role-desc">{role.description}</div>
                    ) : null}
                  </td>
                  <td>
                    {role.isBuiltIn ? (
                      <span className="badge badge-active">{t('builtIn')}</span>
                    ) : (
                      <span className="badge badge-planned">{t('custom')}</span>
                    )}
                  </td>
                  <td>{role.permissions.length} {t('permissionsLabel')}</td>
                  <td>{role._count?.memberRoles ?? 0} {t('members')}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-link" type="button" onClick={() => startEdit(role)}>
                        {t('editRole')}
                      </button>
                      {!role.isBuiltIn ? (
                        <button className="btn-link danger" type="button" onClick={() => removeRole(role)}>
                          {t('delete')}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
                {detail?.id === role.id ? (
                  <tr key="detail">
                    <td colSpan={5}>
                      <div className="detail-panel">
                        <div className="header-actions" style={{ marginBottom: 10 }}>
                          <h3>{t('detailsTitle')}</h3>
                          {detailBusy ? <span className="count-pill">…</span> : null}
                        </div>

                        <h4 className="detail-heading">{t('membersInRole')}</h4>
                        {detail.memberRoles.length === 0 ? (
                          <p className="empty">{t('noMembersInRole')}</p>
                        ) : (
                          <ul className="member-list">
                            {detail.memberRoles.map(({ member }) => (
                              <li key={member.id}>
                                <span className="avatar">{initials(member.user.name)}</span>
                                <span className="member-id">
                                  <strong>{member.user.name}</strong>
                                  <small>{member.user.email}</small>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <h4 className="detail-heading">
                          {t('permissionsLabel')}
                          <span className="count-pill">
                            {detail.permissions.length} / {totalPermissions}
                          </span>
                        </h4>
                        {groupedDetailChips.length === 0 ? (
                          <p className="empty">{t('noPermissionsYet')}</p>
                        ) : (
                          groupedDetailChips.map((g) => (
                            <div key={g.category}>
                              <h5 className="chip-category-title">
                                {t(`categoryLabels.${g.category}`)}
                              </h5>
                              <div className="perm-chip-group">
                                {g.codes.map((code) => (
                                  <span className="perm-chip" key={code}>
                                    {perm(`${code}.name`)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}

      {editing ? (
        <div className="modal-overlay">
          <form className="card modal" onSubmit={save}>
            <div className="header-actions">
              <h2>{editing.id ? t('editRole') : t('createRole')}</h2>
              <button className="btn-ghost close" type="button" onClick={() => setEditing(null)}>
                {t('close')}
              </button>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="r-name">{t('nameLabel')} *</label>
                <input id="r-name" required minLength={2} maxLength={120} value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="r-desc">{t('descriptionLabel')}</label>
                <input id="r-desc" maxLength={500} value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
            </div>
            <div className="header-actions" style={{ marginTop: 14 }}>
              <h3>{t('permissionsLabel')}</h3>
              <span className="count-pill">
                {editing.permissionCodes.length} / {totalPermissions}
              </span>
            </div>
            <div className="role-matrix">
              {catalog.map((group) => {
                const codes = codesByGroup.get(group.category);
                if (!codes || codes.size === 0) return null;
                const allSelected = [...codes].every((c) => editing.permissionCodes.includes(c));
                const selected = codes.size > 0
                  ? [...codes].filter((c) => editing.permissionCodes.includes(c)).length
                  : 0;
                return (
                  <div className="matrix-group" key={group.category}>
                    <h4>
                      <label className="matrix-header">
                        <input type="checkbox" checked={allSelected}
                          onChange={() => toggleGroup(group.category, codes)} />
                        {t(`categoryLabels.${group.category}`)}
                        <span className="count-pill">{selected}/{codes.size}</span>
                      </label>
                    </h4>
                    {group.permissions.map((p) => (
                      <div className="matrix-item" key={p.code}>
                        <input type="checkbox" checked={editing.permissionCodes.includes(p.code)}
                          onChange={() => toggle(p.code)} />
                        <span>{perm(`${p.code}.name`)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="actions-row">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? '…' : t('save')}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setEditing(null)}>
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </Shell>
  );
}