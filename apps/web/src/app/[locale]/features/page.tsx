'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Shell from '@/components/shell';
import { useErrorMessage } from '@/components/error-message';
import { api } from '@/lib/api';
import type { CatalogFeature, FeaturesPayload } from '@/lib/types';

export default function FeaturesPage() {
  const t = useTranslations();
  const ft = useTranslations('featuresPage');
  const cc = useTranslations('catalog');
  const message = useErrorMessage();
  const [data, setData] = useState<FeaturesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    api<FeaturesPayload>('/organizations/me/features')
      .then(setData)
      .catch((err) => setError(message(err)))
      .finally(() => setBusy(false));
  }, []);

  function statusBadge(f: CatalogFeature) {
    if (f.implementationStatus === 'NOT_IMPLEMENTED') {
      return <span className="badge badge-planned">{ft('statusNotImplemented')}</span>;
    }
    return (
      <span className={f.isOperational ? 'badge badge-active' : 'badge badge-planned'}>
        {f.implementationStatus === 'IMPLEMENTED' ? ft('statusImplemented') : ft('statusPartial')}
      </span>
    );
  }

  const catalogCode = (nameKey: string): string => {
    const match = /^feature\.(.+)\.name$/.exec(nameKey);
    return match ? match[1] : nameKey;
  };

  function renderCard(f: CatalogFeature) {
    return (
      <div className="feature-card" key={f.id}>
        <strong>{cc(catalogCode(f.nameKey))}</strong>
        <div>
          {statusBadge(f)} {f.isOperational ? null : <span className="badge badge-planned">{ft('operationalNo')}</span>}
        </div>
        <div style={{ fontSize: 13, color: '#61708b', marginTop: 6 }}>{f.code}</div>
      </div>
    );
  }

  return (
    <Shell>
      <h1>{ft('title')}</h1>
      <p style={{ color: '#61708b' }}>{ft('subtitle')}</p>

      {busy ? <p>{t('common.loading')}</p> : null}
      {error ? <div className="error-text">{error}</div> : null}

      {data ? (
        <>
          <h2>{ft('active')}</h2>
          {data.active.length === 0 ? (
            <p className="empty">{t('dash.noActiveFeatures')}</p>
          ) : (
            <div className="grid">{data.active.map(renderCard)}</div>
          )}

          <h2>{ft('available')}</h2>
          <div className="grid">{data.available.map(renderCard)}</div>
        </>
      ) : null}
    </Shell>
  );
}