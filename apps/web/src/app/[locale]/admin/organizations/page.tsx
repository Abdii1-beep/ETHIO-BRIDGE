'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';
import { Link } from '@/i18n/navigation';

export default function AdminOrganizationsPage() {
  const t = useTranslations();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      const res = await apiFetch<any>(`/api/v1/admin/organizations?${params}`);
      if (res.success && res.data) {
        setOrganizations(res.data.items || []);
      }
    } catch (e) {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [search]);

  const filteredOrgs = organizations.filter(org => 
    !search || 
    org.legalName?.toLowerCase().includes(search.toLowerCase()) ||
    org.tradingName?.toLowerCase().includes(search.toLowerCase()) ||
    org.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              🏢 Platform Organizations Management
            </h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
              Manage all registered organizations and their details
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Search organizations by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: 14
            }}
          />
        </div>

        {loading ? (
          <p style={{ color: '#64748b' }}>Loading organizations...</p>
        ) : error ? (
          <p style={{ color: '#dc2626' }}>{error}</p>
        ) : filteredOrgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
            No organizations found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 10px' }}>Legal Name</th>
                  <th style={{ padding: '12px 10px' }}>Trading Name</th>
                  <th style={{ padding: '12px 10px' }}>Email</th>
                  <th style={{ padding: '12px 10px' }}>Members</th>
                  <th style={{ padding: '12px 10px' }}>Branches</th>
                  <th style={{ padding: '12px 10px' }}>Status</th>
                  <th style={{ padding: '12px 10px' }}>Created</th>
                  <th style={{ padding: '12px 10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => (
                  <tr key={org.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 600 }}>{org.legalName}</td>
                    <td style={{ padding: '12px 10px' }}>{org.tradingName || '—'}</td>
                    <td style={{ padding: '12px 10px' }}>{org.email}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ fontWeight: 700 }}>{org._count?.members || 0}</span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ fontWeight: 700 }}>{org._count?.branches || 0}</span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{
                        fontSize: 11,
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontWeight: 700
                      }}>
                        Active
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#64748b' }}>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <Link 
                        href={`/company-profile?orgId=${org.id}`}
                        style={{ 
                          fontSize: 12, 
                          color: '#2563eb', 
                          textDecoration: 'none',
                          fontWeight: 600
                        }}
                      >
                        View Details
                      </Link>
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
