'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { useErrorMessage } from '@/components/error-message';
import { PRODUCT_CATEGORIES, ORIGIN_COUNTRIES, CURRENCY_CODES, discountPct } from '@/lib/marketplace';
import { getAccessToken, getActiveOrganizationId } from '@/lib/auth';

interface ProductFormValues {
  category: string;
  countryOfOrigin: string;
  unitPrice: number;
  originalPrice: number | null;
  currency: string;
  moq: number;
  productImages: string[];
  productVideo: string | null;
  titleOriginal: string;
  descriptionOriginal: string;
  productRole: string;
  wechat: string;
  whatsapp: string;
  phone: string;
  email: string;
}

interface TranslationResult {
  sourceLanguage: string;
  languages: Record<string, { title: string; description: string; available: boolean }>;
}

export default function ProductCreatePage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const message = useErrorMessage();
  const pathname = usePathname();

  // Form state
  const [form, setForm] = useState<ProductFormValues>({
    category: 'Agro-processing & Machinery',
    countryOfOrigin: 'ET',
    unitPrice: 100000,
    originalPrice: 100000,
    currency: 'USD',
    moq: 2,
    productImages: [],
    productVideo: null,
    titleOriginal: '',
    descriptionOriginal: '',
    productRole: 'SELLER',
    wechat: '',
    whatsapp: '',
    phone: '',
    email: '',
  });

  const [translations, setTranslations] = useState<TranslationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const imageRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Handle form input changes
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value === '' ? (name === 'unitPrice' || name === 'moq' ? 0 : '') : parseFloat(value) }));
  }, []);

  const onChangeNumber = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '') || '0';
    setForm(prev => ({ ...prev, [e.target.name]: parseFloat(val) || 0 }));
  }, []);

  // Generate 4-language translations
  const generateTranslations = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    const { titleOriginal, descriptionOriginal } = form;
    if (!titleOriginal.trim()) {
      setFormError('Product title is required');
      return;
    }
    setIsGenerating(true);
    setFormError(null);
    try {
      const response = await api<TranslationResult>('/ai/product-content', {
        method: 'POST',
        body: {
          title: titleOriginal,
          description: descriptionOriginal,
          sourceLanguage: 'en',
        },
      });
      setTranslations(response);
    } catch (err) {
      setFormError(message(err));
    } finally {
      setIsGenerating(false);
    }
  }, [form, message]);

  // Auto-generate translations when user stops typing (debounce)
  useEffect(() => {
    if (!autoTranslate || isGenerating) return;
    
    const timer = setTimeout(() => {
      if (form.titleOriginal.trim() && form.descriptionOriginal.trim()) {
        generateTranslations();
      }
    }, 1500); // 1.5s delay after typing stops

    return () => clearTimeout(timer);
  }, [form.titleOriginal, form.descriptionOriginal, autoTranslate, isGenerating]);

  if (!isModalOpen) {
    return (
      <div className="pub-body" style={{ padding: 40, textAlign: 'center' }}>
        <img
          src="/logo.png"
          alt="ETHIO-BRIDGE"
          style={{ maxWidth: 120, maxHeight: 60, objectFit: 'contain', marginBottom: 24 }}
        />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>Product Creation</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          List your products on ETHIO-BRIDGE marketplace with AI-powered multilingual content
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '12px 32px', fontSize: 15 }}
        >
          + Create New Product
        </button>
      </div>
    );
  }

  return (
    <div className="pub-body">
      {/* Modal Overlay */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => setIsModalOpen(false)}
      >
        {/* Modal Content */}
        <div
          className="modal-box"
          style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)',
            maxWidth: 600, width: '90%', maxHeight: '90vh', overflowY: 'auto',
            padding: 32, boxShadow: 'var(--shadow-xl)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/logo.png"
                alt="ETHIO-BRIDGE"
                style={{ maxWidth: 40, maxHeight: 24, objectFit: 'contain' }}
              />
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Create New Product</h2>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                background: 'none', border: 'none', fontSize: 28, cursor: 'pointer',
                color: 'var(--text-tertiary)', padding: 0, lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            {t('publishNewProduct')}
          </p>

          {isMounted && !getAccessToken() && (
            <div className="alert" style={{
              padding: '12px 16px', background: 'var(--color-warning-light)',
              color: 'var(--color-warning)', borderRadius: 'var(--radius-md)',
              marginBottom: 20, fontSize: 13, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', border: '1px solid var(--color-warning)'
            }}>
              <span>⚠️ Please sign in to publish products & use AI translation.</span>
              <Link href="/login" className="btn btn-sm btn-primary" style={{ textDecoration: 'none', marginLeft: 8 }}>
                Sign In
              </Link>
            </div>
          )}

        <form
          onSubmit={async e => {
            e.preventDefault();
            setFormError(null);
            
            // Client-side validation
            if (!form.titleOriginal.trim()) {
              setFormError('Product title is required');
              return;
            }
            if (!form.descriptionOriginal.trim()) {
              setFormError('Product description is required');
              return;
            }

            // Check authentication
            const token = getAccessToken();
            const orgId = getActiveOrganizationId();
            if (!token) {
              setFormError('You must be logged in to create a product');
              return;
            }
            if (!orgId) {
              setFormError('You must be a member of an organization to create a product');
              return;
            }
            
            console.log('Authentication check - Token exists:', !!token);
            console.log('Authentication check - Organization ID:', orgId);
            
            setIsSubmitting(true);

            try {
              // Prepare translations array from the translation result
              let translationsArray: Array<{ language: string; title: string; description: string }> = [];
              
              if (translations && translations.languages) {
                translationsArray = Object.entries(translations.languages)
                  .map(([lang, data]) => ({
                    language: lang,
                    title: data.title || '',
                    description: data.description || '',
                  }))
                  .filter(t => t.title && t.title.trim() && t.description && t.description.trim());
              }

              // Start with minimal required fields for testing
              const productData = {
                category: form.category,
                price: Number(form.unitPrice) || 100,
                compareAtPrice: form.originalPrice ? Number(form.originalPrice) : null,
                currency: form.currency || 'USD',
                moq: Number(form.moq) || 1,
                stockQuantity: 0,
                unit: 'pcs',
                originCountry: form.countryOfOrigin || 'CN',
                images: form.productImages || [],
                videoUrl: form.productVideo || null,
                specs: {},
                originalLanguage: 'en',
                title: form.titleOriginal.trim(),
                description: form.descriptionOriginal.trim(),
                translations: translationsArray.length > 0 ? translationsArray : undefined,
                contactInfo: {
                  wechat: form.wechat || null,
                  whatsapp: form.whatsapp || null,
                  phone: form.phone || null,
                  email: form.email || null,
                },
              };

              console.log('Submitting product data:', JSON.stringify(productData, null, 2));
              console.log('Auth check - checking if user is authenticated...');

              const response = await api('/products', {
                method: 'POST',
                body: productData,
              });
              
              console.log('API Response:', response);

              // Success - show success message
              setSuccessMessage('Product published successfully!');
              setTimeout(() => {
                setIsModalOpen(false);
                router.push('/products');
              }, 1500);
            } catch (err) {
              console.error('Product creation error:', err);
              if (err instanceof Error) {
                console.error('Error details:', err.message);
                console.error('Error stack:', err.stack);
              }
              // Check if it's an ApiClientError with more details
              if (err && typeof err === 'object' && 'code' in err) {
                console.error('API Error code:', (err as any).code);
                console.error('API Error status:', (err as any).status);
                console.error('API Error details:', (err as any).details);
              }
              setFormError(message(err));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="compact-grid">

            {/* LEFT COLUMN */}
            <div>
              <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('category')}</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <label className="field-label" style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('countryOfOrigin')}</label>
              <select
                className="input"
                value={form.countryOfOrigin}
                onChange={(e) => setForm(prev => ({ ...prev, countryOfOrigin: e.target.value }))}
              >
                {ORIGIN_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>

              <label className="field-label" style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('unitPrice')}</label>
              <input
                type="number"
                name="unitPrice"
                className="input"
                value={form.unitPrice}
                onChange={onChangeNumber}
                placeholder="100000"
              />{' '}
              {(form.originalPrice && form.originalPrice !== form.unitPrice) && (
                <span style={{ color: 'var(--color-success)', fontWeight: 700, marginLeft: 6, fontSize: 13 }}>
                  -{discountPct(form.unitPrice, form.originalPrice)}%
                </span>
              )}

              <label className="field-label" style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('moq')}</label>
              <input
                type="number"
                name="moq"
                className="input"
                value={form.moq}
                onChange={onChangeNumber}
                placeholder="2"
              />
            </div>

            {/* RIGHT COLUMN */}
            <div>
              <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('originalPriceDiscount')}</label>
              <input
                type="number"
                name="originalPrice"
                className="input"
                value={form.originalPrice || form.unitPrice}
                onChange={onChangeNumber}
                placeholder="100000"
              />{' '}
              {(form.originalPrice && form.originalPrice !== form.unitPrice) && (
                <span style={{ color: 'var(--color-success)', fontWeight: 700, marginLeft: 6, fontSize: 13 }}>
                  -{discountPct(form.unitPrice, form.originalPrice)}%
                </span>
              )}

              <label className="field-label" style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('currency')}</label>
              <select
                className="input"
                value={form.currency}
                onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
              >
{CURRENCY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
                </select>

              <label className="field-label" style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('productImages')}</label>
              <div style={{ marginBottom: 4 }}>
                {form.productImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    style={{
                      width: 64, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)',
                      marginRight: 6, marginBottom: 3, border: '1px solid var(--color-border)',
                    }}
                  />
                ))}
                <input
                  ref={imageRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      const reader = new FileReader();
                      reader.onload = (f) => {
                        const result = f.target?.result as string | undefined;
                        if (result) {
                          const data = [...(form.productImages || [])];
                          data.push(result);
                          setForm(prev => ({ ...prev, productImages: data }));
                        }
                      };
                      reader.readAsDataURL(files[0]);
                    }
                  }}
                />
                <button
                  className="btn btn-sm"
                  style={{
                    marginTop: 2, padding: '4px 12px', background: 'var(--color-primary)',
                    color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 11,
                    cursor: 'pointer',
                  }}
                  onClick={() => imageRef.current?.click()}
                >
                  + Add
                </button>
              </div>

              <label className="field-label" style={{ display: 'block', marginTop: 12, marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('productVideo')}</label>
              <input
                type="text"
                className="input"
                value={form.productVideo || ''}
                placeholder="YouTube URL or MP4"
                onChange={(e) => setForm(prev => ({ ...prev, productVideo: e.target.value }))}
              />
              <span style={{ color: 'var(--text-tertiary)', fontSize: 11, marginLeft: 4 }}>
                Add video for confidence.
              </span>

              <label className="field-label" style={{ display: 'block', marginTop: 16, marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>Product Role</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="productRole"
                    value="SELLER"
                    checked={form.productRole === 'SELLER'}
                    onChange={(e) => setForm(prev => ({ ...prev, productRole: e.target.value }))}
                  />
                  Seller
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="productRole"
                    value="BUYER"
                    checked={form.productRole === 'BUYER'}
                    onChange={(e) => setForm(prev => ({ ...prev, productRole: e.target.value }))}
                  />
                  Buyer
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="radio"
                    name="productRole"
                    value="BOTH"
                    checked={form.productRole === 'BOTH'}
                    onChange={(e) => setForm(prev => ({ ...prev, productRole: e.target.value }))}
                  />
                  Both
                </label>
              </div>
            </div>
          </div>

          {/* ORIGINAL TITLE */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('productTitleOriginal')}</label>
            <input
              ref={titleRef}
              type="text"
              name="titleOriginal"
              className="input"
              value={form.titleOriginal}
              onChange={(e) => setForm(prev => ({ ...prev, titleOriginal: e.target.value }))}
              placeholder="✨ AI Content"
            />
          </div>

          {/* DESCRIPTION */}
          <div style={{ marginTop: 12 }}>
            <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('descriptionOriginal')}</label>
            <textarea
              ref={descRef}
              name="descriptionOriginal"
              className="input"
              rows={3}
              value={form.descriptionOriginal}
              onChange={(e) => setForm(prev => ({ ...prev, descriptionOriginal: e.target.value }))}
              placeholder="Specs, warranty, features..."
            ></textarea>
          </div>

          {/* CONTACT INFORMATION */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Contact Information</h4>
            
            <div className="compact-grid">
              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('wechat')}</label>
                <input
                  type="text"
                  name="wechat"
                  className="input"
                  value={form.wechat}
                  onChange={(e) => setForm(prev => ({ ...prev, wechat: e.target.value }))}
                  placeholder="WeChat ID"
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('whatsapp')}</label>
                <input
                  type="text"
                  name="whatsapp"
                  className="input"
                  value={form.whatsapp}
                  onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="+251..."
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('phone')}</label>
                <input
                  type="text"
                  name="phone"
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+251..."
                />
              </div>

              <div>
                <label className="field-label" style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'var(--text-primary)' }}>{t('email')}</label>
                <input
                  type="email"
                  name="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@company.com"
                />
              </div>
            </div>
          </div>

          {/* GENERATE TRANSLATIONS */}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={generateTranslations}
              disabled={isGenerating || !form.titleOriginal.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 16px', fontSize: 14 }}
            >
              {isGenerating ? 'Generating…' : '✨ Generate AI Translations'}
            </button>
            {formError && <p style={{ marginTop: 8, color: 'var(--color-danger)', fontSize: 12 }}>{formError}</p>}
          </div>

          {/* Auto-translate toggle */}
          <div style={{ marginBottom: 16, marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="autoTranslate"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              style={{ cursor: 'pointer', width: 16, height: 16 }}
            />
            <label htmlFor="autoTranslate" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Auto-translate to 4 languages when typing stops
            </label>
          </div>

          {/* Translation Preview */}
          {translations && (
            <div style={{
              marginTop: 16, padding: 16, background: 'var(--color-surface-2)',
              borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
            }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                🌐 Auto-translated content:
              </h4>
              {Object.entries(translations.languages).map(([lang, data]) => (
                <div key={lang} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>
                    {lang.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {data.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="btn"
              style={{
                padding: '10px 20px', background: 'var(--color-surface)', color: 'var(--text-primary)',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 13, cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !form.titleOriginal.trim() || !form.descriptionOriginal.trim()}
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: 14 }}
            >
              {isSubmitting ? 'Publishing…' : t('publishProductToMarketplace')}
            </button>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="alert alert-success" style={{ marginTop: 16, padding: 12, borderRadius: 'var(--radius-md)', fontSize: 13 }}>
              <span>✓</span>
              <span>{successMessage}</span>
            </div>
          )}
          {formError && (
            <div className="alert alert-error" style={{ marginTop: 16, padding: 12, borderRadius: 'var(--radius-md)', fontSize: 13 }}>
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}