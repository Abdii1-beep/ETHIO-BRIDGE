'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';

type UserStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function AdminUsersPage() {
  const t = useTranslations();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await apiFetch<any>(`/api/v1/admin/users?${params}`);
      if (res.success && res.data) {
        setUsers(res.data.items || []);
      }
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, statusFilter]);

  const approveUser = async (userId: string) => {
    try {
      setActionMsg(null);
      const res = await apiFetch(`/api/v1/admin/users/${userId}/approve`, { method: 'POST' });
      if (res.success) {
        setActionMsg('✓ User approved successfully');
        await loadUsers();
      } else {
        setActionMsg('Failed to approve user');
      }
    } catch (e) {
      setActionMsg('Failed to approve user');
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      setActionMsg(null);
      const res = await apiFetch(`/api/v1/admin/users/${userId}/reject`, { method: 'POST' });
      if (res.success) {
        setActionMsg('✓ User rejected successfully');
        await loadUsers();
      } else {
        setActionMsg('Failed to reject user');
      }
    } catch (e) {
      setActionMsg('Failed to reject user');
    }
  };

  const statusCount = (s: UserStatus) =>
    s === 'ALL' ? users.length : users.filter((u) => u.approvalStatus === s).length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#fef3c7', color: '#92400e' };
      case 'APPROVED': return { bg: '#dcfce7', color: '#166534' };
      case 'REJECTED': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <Shell>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              👥 Platform Users Management
            </h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
              Manage all platform users and approve registrations
            </p>
          </div>
        </div>

        {actionMsg && (
          <div style={{ padding: 12, backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {actionMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14
            }}
          />
        </div>

        {/* Status Tabs */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as UserStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`tab${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'ALL' ? 'All Users' : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className="tab-count">{statusCount(s)}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading users...</p>
        ) : error ? (
          <p style={{ color: '#dc2626' }}>{error}</p>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            No users found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 10px' }}>Name</th>
                  <th style={{ padding: '12px 10px' }}>Email</th>
                  <th style={{ padding: '12px 10px' }}>Platform Role</th>
                  <th style={{ padding: '12px 10px' }}>Approval Status</th>
                  <th style={{ padding: '12px 10px' }}>Active</th>
                  <th style={{ padding: '12px 10px' }}>Email Verified</th>
                  <th style={{ padding: '12px 10px' }}>Last Login</th>
                  <th style={{ padding: '12px 10px' }}>Created</th>
                  <th style={{ padding: '12px 10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const colors = statusColor(user.approvalStatus);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>{user.name}</td>
                      <td style={{ padding: '12px 10px' }}>{user.email}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          fontSize: 11,
                          backgroundColor: user.platformRole === 'PLATFORM_SUPER_ADMIN' ? '#fef3c7' : '#e0e7ff',
                          color: user.platformRole === 'PLATFORM_SUPER_ADMIN' ? '#92400e' : '#3730a3',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 700
                        }}>
                          {user.platformRole || 'None'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          fontSize: 11,
                          backgroundColor: colors.bg,
                          color: colors.color,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 700
                        }}>
                          {user.approvalStatus || 'PENDING'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          fontSize: 11,
                          backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2',
                          color: user.isActive ? '#166534' : '#991b1b',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 700
                        }}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {user.isEmailVerified ? '✓' : '✗'}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#64748b' }}>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#64748b' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {user.approvalStatus === 'PENDING' && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: '#dcfce7', color: '#166534', border: 'none' }}
                              onClick={() => approveUser(user.id)}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: 'none' }}
                              onClick={() => rejectUser(user.id)}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                        {user.approvalStatus === 'APPROVED' && (
                          <span style={{ color: '#166534', fontSize: 12, fontWeight: 600 }}>Approved</span>
                        )}
                        {user.approvalStatus === 'REJECTED' && (
                          <span style={{ color: '#991b1b', fontSize: 12, fontWeight: 600 }}>Rejected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
