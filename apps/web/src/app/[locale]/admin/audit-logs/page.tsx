'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';

export default function AdminAuditLogsPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      const res = await apiFetch<any>(`/api/v1/admin/audit-logs?${params}`);
      if (res.success && res.data) {
        setLogs(res.data.items || []);
      }
    } catch (e) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const filteredLogs = logs.filter(log => 
    !actionFilter || log.action === actionFilter
  );

  const actionColors: Record<string, string> = {
    'CREATE': '#dcfce7',
    'UPDATE': '#e0e7ff',
    'DELETE': '#fee2e2',
    'LOGIN': '#fef3c7',
    'FEATURE_REQUEST_REVIEW': '#f3e8ff',
  };

  const actionTextColors: Record<string, string> = {
    'CREATE': '#166534',
    'UPDATE': '#3730a3',
    'DELETE': '#991b1b',
    'LOGIN': '#92400e',
    'FEATURE_REQUEST_REVIEW': '#6b21a8',
  };

  return (
    <Shell>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              📋 Platform Audit Logs
            </h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
              Track all system events and user activities
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14,
              minWidth: 200
            }}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="FEATURE_REQUEST_REVIEW">Feature Request Review</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading audit logs...</p>
        ) : error ? (
          <p style={{ color: '#dc2626' }}>{error}</p>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            No audit logs found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 8px' }}>Timestamp</th>
                  <th style={{ padding: '10px 8px' }}>Action</th>
                  <th style={{ padding: '10px 8px' }}>User ID</th>
                  <th style={{ padding: '10px 8px' }}>Organization ID</th>
                  <th style={{ padding: '10px 8px' }}>Entity</th>
                  <th style={{ padding: '10px 8px' }}>Entity ID</th>
                  <th style={{ padding: '10px 8px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        fontSize: 10,
                        backgroundColor: actionColors[log.action] || '#f1f5f9',
                        color: actionTextColors[log.action] || '#475569',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 700
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 11 }}>
                      {log.userId ? log.userId.slice(0, 8) : '—'}
                    </td>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 11 }}>
                      {log.organizationId ? log.organizationId.slice(0, 8) : '—'}
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                      {log.entity}
                    </td>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 11 }}>
                      {log.entityId ? log.entityId.slice(0, 8) : '—'}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.newValue ? JSON.stringify(log.newValue).slice(0, 50) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
