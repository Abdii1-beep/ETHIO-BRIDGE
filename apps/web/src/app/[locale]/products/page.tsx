'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/shell';
import { apiFetch } from '@/lib/api-client';
import { Link, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { useMemberContext } from '@/lib/use-member-context';
import { CURRENCY_SYMBOLS } from '@/lib/marketplace';
import { getAccessToken, getActiveOrganizationId } from '@/lib/auth';

const CATEGORIES = [
  'All Categories',
  'Electronics & IT',
  'Electrical & Solar Energy',
  'Machinery & Industrial Equipment',
  'Agriculture & Livestock',
  'Agro-processing & Machinery',
  'Coffee & Beverages',
  'Textiles, Garments & Leather',
  'Construction & Building Materials',
  'Food Processing & Staples',
];

const SORTS = [
  { key: '', label: '🆕 Newest' },
  { key: 'featured', label: '⭐ Featured' },
  { key: 'top-viewed', label: '👁️ Top Viewed' },
  { key: 'top-sold', label: '📈 Best Sellers' },
  { key: 'country-cn', label: '🇨🇳 China First' },
  { key: 'country-et', label: '🇪🇹 Ethiopia First' },
  { key: 'oldest', label: '📅 Oldest First' },
  { key: 'price-low', label: '💰 Price: Low to High' },
  { key: 'price-high', label: '💰 Price: High to Low' },
];

const ORIGIN_FLAG: Record<string, string> = {
  ET: '🇪🇹', CN: '🇨🇳', IN: '🇮🇳', TR: '🇹🇷', AE: '🇦🇪',
  KE: '🇰🇪', DE: '🇩🇪', US: '🇺🇸', NL: '🇳🇱', JP: '🇯🇵',
};
const ORIGIN_NAME: Record<string, string> = {
  ET: 'Ethiopia', CN: 'China', IN: 'India', TR: 'Turkey', AE: 'UAE',
  KE: 'Kenya', DE: 'Germany', US: 'United States', NL: 'Netherlands', JP: 'Japan',
};

export default function ProductsPage() {
  const locale = useLocale();
  const ctx = useMemberContext();
  const router = useRouter();
  const canCreate = !ctx.membership || ctx.has('products.create');
  const myOrgId = ctx.membership?.organization?.id;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [originCountry, setOriginCountry] = useState('');
  const [featured, setFeatured] = useState(false);
  const [sort, setSort] = useState('');

  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [apptWhen, setApptWhen] = useState('');
  const [apptDur, setApptDur] = useState(30);
  const [apptNotes, setApptNotes] = useState('');
  const [apptBusy, setApptBusy] = useState(false);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareProduct, setShareProduct] = useState<any | null>(null);
  const [gridLightboxOpen, setGridLightboxOpen] = useState(false);
  const [gridLightboxImages, setGridLightboxImages] = useState<string[]>([]);
  const [gridLightboxIndex, setGridLightboxIndex] = useState(0);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (category && category !== 'All Categories') p.set('category', category);
    if (originCountry) p.set('originCountry', originCountry);
    if (featured) p.set('isFeatured', 'true');
    
    // Handle custom sorting that needs client-side processing
    let sortParam = sort;
    if (sort === 'country-cn' || sort === 'country-et' || sort === 'oldest' || sort === 'price-low' || sort === 'price-high') {
      sortParam = ''; // Don't send to API, handle client-side
    } else if (sort) {
      sortParam = sort;
    }
    
    if (sortParam) p.set('sort', sortParam);
    p.set('language', locale);
    const res = await apiFetch<any[]>(`/api/v1/products?${p}`);
    
    if (res.success && res.data) {
      let sortedProducts = [...res.data];
      
      // Apply client-side sorting for custom options
      if (sort === 'country-cn') {
        sortedProducts.sort((a, b) => {
          if (a.originCountry === 'CN' && b.originCountry !== 'CN') return -1;
          if (a.originCountry !== 'CN' && b.originCountry === 'CN') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } else if (sort === 'country-et') {
        sortedProducts.sort((a, b) => {
          if (a.originCountry === 'ET' && b.originCountry !== 'ET') return -1;
          if (a.originCountry !== 'ET' && b.originCountry === 'ET') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } else if (sort === 'oldest') {
        sortedProducts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sort === 'price-low') {
        sortedProducts.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sort === 'price-high') {
        sortedProducts.sort((a, b) => Number(b.price) - Number(a.price));
      }
      
      setProducts(sortedProducts);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [locale, category, originCountry, featured, sort]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    setActiveImage(0);
    const res = await apiFetch<any>(`/api/v1/products/${id}?language=${locale}`);
    if (res.success && res.data) setDetail(res.data);
    setDetailLoading(false);
  };

  const totalViews = products.reduce((s, p) => s + (p.viewCount ?? 0), 0);
  const totalSold = products.reduce((s, p) => s + (p.soldCount ?? 0), 0);

  const isEmbedableVideo = (url?: string) =>
    /\.mp4|\.webm|\.ogg|\.mov$/i.test(url || '') || /youtube\.com\/embed|youtu\.be/.test(url || '');

  const videoHref = (url?: string) => {
    const m = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/.exec(url || '');
    return m ? `https://www.youtube.com/embed/${m[1]}` : url;
  };

  const originOf = (c?: string) => ({
    flag: ORIGIN_FLAG[c ?? ''] ?? '🌐',
    name: ORIGIN_NAME[c ?? ''] ?? c ?? 'Global',
  });

  // Request Quote → forward directly to the product owner inside the chat room.
  const requestQuote = async (p: any) => {
    if (quoteBusy) return;
    const token = getAccessToken();
    if (!token) {
      setActionMsg('⚠️ Please sign in to message this seller.');
      router.push('/login');
      return;
    }
    const orgId = getActiveOrganizationId();
    if (!orgId) {
      setActionMsg('⚠️ Please register or select an organization first to start B2B negotiations.');
      router.push('/create-organization');
      return;
    }
    if (!p?.organization?.id) {
      setActionMsg('This seller has no contact channel yet.');
      return;
    }
    if (p.organization.id === orgId) {
      setActionMsg('This is your own product listing.');
      return;
    }
    setQuoteBusy(true);
    setActionMsg(null);
    try {
      const init = await apiFetch<{ id: string }>('/api/v1/conversations/initiate', {
        method: 'POST',
        body: JSON.stringify({
          targetOrgId: p.organization.id,
          title: `💬 Product Inquiry: ${p.title.slice(0, 80)}`,
        }),
      });
      if (!init.success || !init.data) {
        setActionMsg(init.error?.message ?? 'Could not start chat with seller.');
        return;
      }
      await apiFetch(`/api/v1/conversations/${init.data.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          text: `I'm interested in "${p.title}". Please send me a quote.`,
          language: locale,
        }),
      });
      setDetail(null);
      router.push('/messages');
    } catch (e: any) {
      setActionMsg(e.message);
    } finally {
      setQuoteBusy(false);
    }
  };

  // Schedule a video discussion with the product owner (live video room, not chat-only).
  const scheduleVideo = async () => {
    if (apptBusy || !detail) return;
    const token = getAccessToken();
    if (!token) {
      setActionMsg('⚠️ Please sign in to schedule video meetings.');
      router.push('/login');
      return;
    }
    const orgId = getActiveOrganizationId();
    if (!orgId) {
      setActionMsg('⚠️ Please register or select an organization first to schedule B2B video meetings.');
      router.push('/create-organization');
      return;
    }
    if (!apptWhen) {
      setActionMsg('Please pick a date & time for the video meeting.');
      return;
    }
    setApptBusy(true);
    setActionMsg(null);
    try {
      const res = await apiFetch<any>('/api/v1/appointments', {
        method: 'POST',
        body: JSON.stringify({
          counterpartOrgId: detail.organization.id,
          title: `📹 Video discussion: ${detail.title.slice(0, 80)}`,
          scheduledAt: new Date(apptWhen).toISOString(),
          durationMins: apptDur,
          notes: apptNotes.trim() || undefined,
        }),
      });
      if (res.success && res.data) {
        setAppointmentOpen(false);
        setApptWhen('');
        setApptNotes('');
        setActionMsg(`✓ Video meeting scheduled for ${new Date(res.data.scheduledAt).toLocaleString()} — see it in the Negotiation Room.`);
      } else {
        setActionMsg(res.error?.message ?? 'Could not schedule meeting.');
      }
    } catch (e: any) {
      setActionMsg(e.message);
    } finally {
      setApptBusy(false);
    }
  };

  const sym = (c: string) => CURRENCY_SYMBOLS[c] ?? `${c} `;
  const fmt = (n: number) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const isMine = (orgId?: string) => !!myOrgId && orgId === myOrgId;
  
  const handleShareProduct = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareProduct(p);
    setShareModalOpen(true);
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setActionMsg('Link copied to clipboard!');
      setTimeout(() => setActionMsg(null), 2000);
    } catch (err) {
      setActionMsg('Failed to copy link');
    }
  };

  return (
    <Shell>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="page-title">🌏 Global B2B Marketplace</h1>
            <p className="page-subtitle">
              Verified Chinese manufacturers meets Ethiopian exporters — AI-powered cross-language trade discovery
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className={`btn ${featured ? 'btn-warning' : 'btn-secondary'} btn-sm`}
              onClick={() => setFeatured(!featured)}
            >
              ⭐ Featured
            </button>
            <Link href="/products/create" className="btn btn-primary btn-sm">
              + Add Product
            </Link>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: 12, backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {actionMsg}
        </div>
      )}

      {/* Country Tabs */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <button
          className={`btn btn-sm ${!originCountry ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setOriginCountry('')}
        >
          🌏 All Origins
        </button>
        {(['CN', 'ET', 'IN', 'AE'] as const).map((code) => (
          <button
            key={code}
            className={`btn btn-sm ${originCountry === code ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setOriginCountry(originCountry === code ? '' : code)}
          >
            {ORIGIN_FLAG[code]} {ORIGIN_NAME[code]}
          </button>
        ))}
      </div>

      {/* Search & Category Filters */}
      <div className="card mb-4" style={{ padding: '16px' }}>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1" style={{ minWidth: 240, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>🔍</span>
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 34 }}
              placeholder="Search solar pumps, coffee, machinery..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <select
            className="input"
            style={{ width: 210 }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map(c => <option key={c} value={c === 'All Categories' ? '' : c}>{c}</option>)}
          </select>
          <button className="btn btn-primary" onClick={load}>Search</button>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 flex-wrap" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginRight: 8, alignSelf: 'center' }}>
            Sort by:
          </div>
          {SORTS.map((s) => (
            <button
              key={s.key}
              className={`btn btn-sm ${sort === s.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Banner */}
      <div className="kpi-grid mb-4" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="kpi-card" style={{ '--kpi-accent': '#4f46e5', '--kpi-bg': '#e0e7ff', '--kpi-color': '#4f46e5' } as any}>
          <div className="kpi-icon">📦</div>
          <div className="kpi-label">Listed Products</div>
          <div className="kpi-value">{products.length}</div>
          <div className="kpi-sub">Live on the marketplace</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': '#0ea5e9', '--kpi-bg': '#e0f2fe', '--kpi-color': '#0ea5e9' } as any}>
          <div className="kpi-icon">👁️</div>
          <div className="kpi-label">Total Views</div>
          <div className="kpi-value">{totalViews.toLocaleString()}</div>
          <div className="kpi-sub">Real product page views</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': '#16a34a', '--kpi-bg': '#dcfce7', '--kpi-color': '#16a34a' } as any}>
          <div className="kpi-icon">📈</div>
          <div className="kpi-label">Total Sold</div>
          <div className="kpi-value">{totalSold.toLocaleString()}</div>
          <div className="kpi-sub">Units via accepted quotes</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': '#dc2626', '--kpi-bg': '#fee2e2', '--kpi-color': '#dc2626' } as any}>
          <div className="kpi-icon">🇨🇳</div>
          <div className="kpi-label">China Origin</div>
          <div className="kpi-value">{products.filter(p => p.originCountry === 'CN').length}</div>
          <div className="kpi-sub">Verified manufacturers</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': '#d97706', '--kpi-bg': '#fef3c7', '--kpi-color': '#d97706' } as any}>
          <div className="kpi-icon">🇪🇹</div>
          <div className="kpi-label">Ethiopia Origin</div>
          <div className="kpi-value">{products.filter(p => p.originCountry === 'ET').length}</div>
          <div className="kpi-sub">Export-ready goods</div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="product-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="product-card">
              <div className="skeleton" style={{ height: 180, borderRadius: '0' }} />
              <div style={{ padding: 16 }}>
                <div className="skeleton mb-2" style={{ height: 12, width: '60%' }} />
                <div className="skeleton mb-2" style={{ height: 18, width: '90%' }} />
                <div className="skeleton" style={{ height: 12, width: '75%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No products match your criteria</div>
          <div className="empty-state-desc">Try adjusting filters or publish the first product</div>
          {canCreate && (
            <Link href="/products/create" className="btn btn-primary">
              + Publish Product to Global Marketplace
            </Link>
          )}
        </div>
      ) : (
        <div className="product-grid">
          {products.map(p => {
            const discount = p.discountPct ?? 0;
            const o = originOf(p.originCountry);
            return (
              <div
                key={p.id}
                className={`product-card ${p.isFeatured ? 'featured-product' : ''}`}
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => openDetail(p.id)}
              >
                {p.images?.[0] ? (
                  <div className="product-card-image-wrapper">
                    <img 
                      src={p.images[0]} 
                      alt={p.title} 
                      className="product-card-image"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setGridLightboxImages(p.images);
                        setGridLightboxIndex(0);
                        setGridLightboxOpen(true);
                      }}
                    />
                    {p.images.length > 1 && (
                      <div className="image-gallery-indicator">
                        <span>📷 {p.images.length}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="product-card-image-placeholder">{o.flag}</div>
                )}
                {discount > 0 && (
                  <span className="discount-badge">−{discount}%</span>
                )}
                {p.stockQuantity > 0 && (
                  <span className="stock-badge">✓ In Stock</span>
                )}
                {p.videoUrl && (
                  <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: 20, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>🎬 Video</span>
                )}
                {!isMine(p.organizationId) && (
                  <button
                    className="share-button"
                    onClick={(e) => handleShareProduct(p, e)}
                    title="Share product"
                  >
                    📤
                  </button>
                )}

                <div className="product-card-body">
                  <div className="product-card-meta">
                    <span className={`origin-badge ${p.originCountry === 'CN' ? 'origin-cn' : 'origin-et'}`}>
                      {o.flag} {o.name}
                    </span>
                    <div className="flex gap-1">
                      {p.isFeatured && <span className="verified-badge">⭐ Featured</span>}
                    </div>
                  </div>

                  <div className="product-card-title">{p.title}</div>
                  <div className="product-card-desc">{p.description}</div>

                  <div className="flex items-center justify-between">
                    <div>
                      {discount > 0 && (
                        <div style={{ fontSize: 12, color: '#64748b', textDecoration: 'line-through' }}>
                          {sym(p.currency)}{fmt(p.compareAtPrice)}
                        </div>
                      )}
                      <div className="product-card-price" style={{ color: discount > 0 ? '#dc2626' : undefined }}>
                        {sym(p.currency)}{fmt(p.price)}
                        {discount > 0 && (
                          <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 800, marginLeft: 6 }}>{discount}% off</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        per {p.unit} · MOQ: {p.moq} {p.unit}
                      </div>
                    </div>
                    <span className="badge badge-gray">{p.category}</span>
                  </div>
                </div>

                <div className="product-card-footer">
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ position: 'relative', display: 'inline-flex' }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'var(--color-surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                        }}
                      >
                        {o.flag}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 8,
                          height: 8,
                          background: 'var(--color-success)',
                          border: '2px solid var(--color-surface)',
                          borderRadius: '50%',
                        }}
                      />
                    </div>
                    {p.organization?.tradingName ?? p.organization?.legalName}
                  </div>
                  <div className="flex gap-2 items-center" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span>👁️ {p.viewCount ?? 0}</span>
                    <span>📈 {p.soldCount ?? 0}</span>
                    <span className="online-indicator">🟢 Online</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => { e.stopPropagation(); requestQuote(p); }}
                      disabled={quoteBusy}
                    >
                      💬 Chat Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {detailLoading && (
        <div className="modal-overlay">
          <div className="modal"><div className="skeleton" style={{ height: 200 }} /></div>
        </div>
      )}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{detail.title}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}>✕ Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="detail-grid">
              <div>
                {detail.images?.length ? (
                  <>
                    <img
                      src={detail.images[activeImage]}
                      alt={detail.title}
                      onClick={() => setLightboxIndex(activeImage)}
                      style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 10, cursor: 'zoom-in' }}
                    />
                    {detail.images.length > 1 && (
                      <div className="flex gap-2" style={{ marginTop: 8 }}>
                        {detail.images.map((img: string, i: number) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            onClick={() => setActiveImage(i)}
                            style={{
                              width: 64, height: 48, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                              border: activeImage === i ? '2px solid var(--color-primary)' : '2px solid transparent',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="product-card-image-placeholder" style={{ height: 260 }}>
                    {originOf(detail.originCountry).flag}
                  </div>
                )}

                {detail.videoUrl && (
                  isEmbedableVideo(detail.videoUrl) ? (
                    <video controls style={{ width: '100%', marginTop: 12, borderRadius: 10 }} src={videoHref(detail.videoUrl)} poster={detail.images?.[0]}>
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <a
                      href={detail.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ marginTop: 12, width: '100%' }}
                    >
                      ▶ Watch demo video
                    </a>
                  )
                )}
              </div>

              <div>
                <div className="flex gap-2 flex-wrap" style={{ marginBottom: 12 }}>
                  <span className={`origin-badge ${detail.originCountry === 'CN' ? 'origin-cn' : 'origin-et'}`}>
                    {originOf(detail.originCountry).flag} {originOf(detail.originCountry).name}
                  </span>
                  <span className="badge badge-gray">{detail.category}</span>
                  {detail.isFeatured && <span className="verified-badge">⭐ Featured</span>}
                  {detail.organization?.verificationLevel === 'VERIFIED' && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                </div>

                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.6 }}>
                  {detail.description}
                </p>

                <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <dt style={{ color: 'var(--text-tertiary)' }}>Price</dt>
                  <dd style={{ fontWeight: 700 }}>
                    {detail.discountPct > 0 && (
                      <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontWeight: 500, marginRight: 8 }}>
                        {sym(detail.currency)}{fmt(detail.compareAtPrice)}
                      </span>
                    )}
                    <span style={{ color: detail.discountPct > 0 ? '#dc2626' : undefined }}>
                      {sym(detail.currency)}{fmt(detail.price)}
                    </span>
                    {detail.discountPct > 0 && (
                      <span className="discount-badge" style={{ position: 'static', marginLeft: 8, fontSize: 11 }}>
                        −{detail.discountPct}%
                      </span>
                    )}
                    {' '}/ {detail.unit}
                  </dd>
                </div>
                <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <dt style={{ color: 'var(--text-tertiary)' }}>MOQ</dt>
                  <dd>{detail.moq} {detail.unit}</dd>
                </div>
                <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <dt style={{ color: 'var(--text-tertiary)' }}>Stock</dt>
                  <dd>{detail.stockQuantity} {detail.unit}</dd>
                </div>
                <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <dt style={{ color: 'var(--text-tertiary)' }}>Views</dt>
                  <dd>👁️ {detail.viewCount}</dd>
                </div>
                <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <dt style={{ color: 'var(--text-tertiary)' }}>Sold</dt>
                  <dd>📈 {detail.soldCount} {detail.unit}</dd>
                </div>
                <div className="kv" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <dt style={{ color: 'var(--text-tertiary)' }}>Seller</dt>
                  <dd>{detail.organization?.tradingName ?? detail.organization?.legalName}</dd>
                </div>

                {detail.specs && Object.keys(detail.specs).length > 0 && (
                  <div style={{ margin: '12px 0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Specifications</div>
                    {Object.entries(detail.specs).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>{String(k)}</span>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2" style={{ marginTop: 16, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => requestQuote(detail)} disabled={quoteBusy}>
                    {quoteBusy ? 'Connecting to seller...' : '💬 Request Quote — chat with seller'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setAppointmentOpen(true)}>
                    📹 Schedule Video Discussion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Image Lightbox */}
      {lightboxIndex !== null && detail?.images?.length ? (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <button
            className="lightbox-close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            ✕
          </button>
          {detail.images.length > 1 && (
            <>
              <button
                className="lightbox-nav lightbox-prev"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + detail.images.length) % detail.images.length); }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="lightbox-nav lightbox-next"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % detail.images.length); }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}
          <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <img key={lightboxIndex} src={detail.images[lightboxIndex]} alt={detail.title} className="lightbox-img" />
            <div className="lightbox-caption">
              {detail.title} — {lightboxIndex + 1} / {detail.images.length}
            </div>
            <div className="lightbox-thumbs">
              {detail.images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  onClick={() => setLightboxIndex(i)}
                  style={{
                    width: 56, height: 42, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                    border: lightboxIndex === i ? '2px solid #fff' : '2px solid rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Schedule Video Appointment Modal */}
      {appointmentOpen && detail && (
        <div className="modal-overlay" onClick={() => setAppointmentOpen(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📹 Schedule Video Discussion</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setAppointmentOpen(false)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Live meeting with <b>{detail.organization?.tradingName ?? detail.organization?.legalName}</b> on a secure
              video room (Jitsi). Both sides chat in the Negotiation Room until it starts.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              className="input"
              style={{ width: '100%', marginBottom: 12 }}
              value={apptWhen}
              min={new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)}
              onChange={(e) => setApptWhen(e.target.value)}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Duration</label>
            <select
              className="input"
              style={{ width: '100%', marginBottom: 12 }}
              value={apptDur}
              onChange={(e) => setApptDur(Number(e.target.value))}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Agenda / Notes (optional)</label>
            <textarea
              className="input"
              style={{ width: '100%', minHeight: 60, marginBottom: 16 }}
              placeholder="e.g. Contract terms, samples, delivery schedule..."
              value={apptNotes}
              onChange={(e) => setApptNotes(e.target.value)}
            />
            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setAppointmentOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={scheduleVideo} disabled={apptBusy}>
                {apptBusy ? 'Scheduling...' : 'Send Meeting Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Product Modal */}
      {shareModalOpen && shareProduct && (
        <div className="modal-overlay" onClick={() => setShareModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📤 Share Product</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShareModalOpen(false)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Share <b>{shareProduct.title}</b> with potential buyers
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Product Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input"
                  style={{ flex: 1 }}
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/products/${shareProduct.id}`}
                />
                <button 
                  className="btn btn-secondary"
                  onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/products/${shareProduct.id}`)}
                >
                  Copy
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Share via
              </label>
              <div className="flex gap-2">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/products/${shareProduct.id}`;
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                  }}
                >
                  Facebook
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/products/${shareProduct.id}`;
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareProduct.title)}`, '_blank');
                  }}
                >
                  Twitter
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/products/${shareProduct.id}`;
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                  }}
                >
                  LinkedIn
                </button>
              </div>
            </div>

            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShareModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid Lightbox */}
      {gridLightboxOpen && gridLightboxImages.length > 0 && (
        <div className="lightbox-overlay" onClick={() => setGridLightboxOpen(false)}>
          <button
            className="lightbox-close"
            onClick={() => setGridLightboxOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
          {gridLightboxImages.length > 1 && (
            <>
              <button
                className="lightbox-nav lightbox-prev"
                onClick={(e) => { e.stopPropagation(); setGridLightboxIndex((gridLightboxIndex - 1 + gridLightboxImages.length) % gridLightboxImages.length); }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="lightbox-nav lightbox-next"
                onClick={(e) => { e.stopPropagation(); setGridLightboxIndex((gridLightboxIndex + 1) % gridLightboxImages.length); }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}
          <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
            <img key={gridLightboxIndex} src={gridLightboxImages[gridLightboxIndex]} alt="Product image" className="lightbox-img" />
            <div className="lightbox-caption">
              Product Image — {gridLightboxIndex + 1} / {gridLightboxImages.length}
            </div>
            <div className="lightbox-thumbs">
              {gridLightboxImages.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  onClick={() => setGridLightboxIndex(i)}
                  style={{
                    width: 56, height: 42, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                    border: gridLightboxIndex === i ? '2px solid #fff' : '2px solid rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}