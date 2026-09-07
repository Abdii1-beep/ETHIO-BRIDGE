'use client';

import { useState, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { useErrorMessage } from '@/components/error-message';
import { PRODUCT_CATEGORIES, ORIGIN_COUNTRIES, CURRENCY_CODES, discountPct } from '@/lib/marketplace';

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
}

interface TranslationResult {
  sourceLanguage: string;
  languages: Record<string, { title: string; description: string; available: boolean }>;
}

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProductCreateModal({ open, onClose }: ProductModalProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const message = useErrorMessage();

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
  });

  const [translations, setTranslations] = useState<TranslationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
  }, [form]);

  // Clear translations when form changes (title or description edited)
  useState(() => {
    setTranslations(null);
    return null;
  });

  return (
    <div className="pub-body">
      {/* Modal overlay */}
      {open && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="modal-header">
              <h1 className="modal-title">Create New Product</h1>
              <button
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form>
              <div className="modal-form">

                {/* LEFT COLUMN */}
                <div>
                  <label className="form-label">{t('category')}</label>
                  <select
                    style={{
                      width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                      borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <label className="form-label" style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>{t('countryOfOrigin')}</label>
                  <select
                    style={{
                      width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                      borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                    value={form.countryOfOrigin}
                    onChange={(e) => setForm(prev => ({ ...prev, countryOfOrigin: e.target.value }))}
                  >
                    {ORIGIN_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>

                  <label className="form-label" style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>{t('unitPrice')}</label>
                  <input
                    type="number"
                    name="unitPrice"
                    style={{
                      width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                      borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                    value={form.unitPrice}
                    onChange={onChangeNumber}
                    placeholder="100000"
                  />{' '}
                  {(form.originalPrice && form.originalPrice !== form.unitPrice) && (
                    <span style={{ color: 'var(--color-success)', fontWeight: 600, marginLeft: 8 }}>
                      -{discountPct(form.unitPrice, form.originalPrice)}%
                    </span>
                  )}

                  <label className="form-label" style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>{t('moq')}</label>
                  <input
                    type="number"
                    name="moq"
                    style={{
                      width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                      borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                    value={form.moq}
                    onChange={onChangeNumber}
                    placeholder="2"
                  />
                </div>

                {/* RIGHT COLUMN */}
                <div>
                  <label className="form-label" style={{ marginBottom: 8, fontWeight: 600 }}>{t('originalPriceDiscount')}</label>
                  <input
                    type="number"
                    name="originalPrice"
                    style={{
                      width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                      borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                    value={form.originalPrice || form.unitPrice}
                    onChange={onChangeNumber}
                    placeholder="100000"
                  />{' '}
                  {(form.originalPrice && form.originalPrice !== form.unitPrice) && (
                    <span style={{ color: 'var(--color-success)', fontWeight: 600, marginLeft: 8 }}>
                      -{discountPct(form.unitPrice, form.originalPrice)}%
                    </span>
                  )}

                  <label className="form-label" style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>{t('currency')}</label>
                  <select
                    style={{
                      width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                      borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                    value={form.currency}
                    onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    {CURRENCY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <label className="form-label" style={{ marginBottom: 8, fontWeight: 600 }}>{t('productImages')}</label>
                  <div style={{ marginBottom: 8 }}>
                    {form.productImages.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        style={{
                          width: 80, height: 56, objectFit: 'cover', borderRadius: 6,
                          marginRight: 8, marginBottom: 4, border: '1px solid var(--color-border)',
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
                      style={{
                        marginTop: 4, padding: '6px 12px', background: 'var(--color-primary)',
                        color: '#fff', border: 'none', borderRadius: 6, fontSize: 12,
                        cursor: 'pointer',
                      }}
                      onClick={() => imageRef.current?.click()}
                    >
                      + Add Image
                    </button>
                  </div>

                  <label className="form-label" style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>{t('productVideo')}</label>
                  <input
                    type="text"
                    value={form.productVideo || ''}
                    style={{
                      width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)',
                      borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                    placeholder="https://www.youtube.com/watch?v=... or hosted MP4"
                    onChange={(e) => setForm(prev => ({ ...prev, productVideo: e.target.value }))}
                  />
                  <small style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>
                    Add a demonstration video for stronger buyer confidence.
                  </small>
                </div>
              </div>

              {/* ORIGINAL TITLE & DESCRIPTION */}
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('productTitleOriginal')}</label>
                <input
                  ref={titleRef}
                  type="text"
                  name="titleOriginal"
                  style={{
                    width: '100%', padding: '12px', border: '1px solid var(--color-border)',
                    borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                    fontSize: 16, fontWeight: 700,
                  }}
                  value={form.titleOriginal}
                  onChange={(e) => setForm(prev => ({ ...prev, titleOriginal: e.target.value }))}
                  placeholder="✨ Generate 4-Language Content with AI"
                />
              </div>

              <div style={{ marginTop: 16, padding: 16, background: 'var(--color-surface)', borderRadius: 12 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>{t('descriptionOriginal')}</label>
                <textarea
                  ref={descRef}
                  name="descriptionOriginal"
                  rows={3}
                  style={{
                    width: '100%', padding: '12px', border: '1px solid var(--color-border)',
                    borderRadius: 9, background: 'var(--color-surface)', color: 'var(--text-primary)',
                    fontSize: 14, resize: 'vertical',
                  }}
                  value={form.descriptionOriginal}
                  onChange={(e) => setForm(prev => ({ ...prev, descriptionOriginal: e.target.value }))}
                  placeholder="Describe specifications, warranty, features..."
                ></textarea>
              </div>

              {/* GENERATE TRANSLATIONS */}
              <div style={{ marginTop: 24 }}>
                <button
                  onClick={generateTranslations}
                  disabled={isGenerating || !form.titleOriginal.trim()}
                  style={{
                    width: '100%', padding: '12px', background: isGenerating ? 'var(--color-tertiary)' : 'var(--color-primary)',
                    color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isGenerating ? 'Generating…' : '✨ Generate 4-Language Content with AI'}
                </button>
                {formError && <p style={{ marginTop: 8, color: 'var(--color-danger)' }}>{formError}</p>}
              </div>

              {/* MULTILINGUAL CONTENT DISPLAY */}
              {translations && (
                <div style={{ marginTop: 32, padding: 24, background: 'var(--color-surface)', borderRadius: 12 }}>
                  <h3 style={{ fontSize: 18, marginBottom: 16, color: 'var(--text-primary)' }}>
                    {t('multilingualContent')}
                  </h3>

                  <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {['en', 'zh', 'am', 'om'].map((lang) => {
                      const langData = translations.languages[lang];
                      const langLabels: Record<string, string> = {
                        en: 'English',
                        zh: '简体中文',
                        am: 'አማርኞች',
                        om: 'Afaan Oromoo',
                      };
                      const statusClass = langData.available ? 'available' : 'pending';
                      const statusText = langData.available ? '✓ generated' : 'pending — click Generate';

                      return (
                        <div key={lang} style={{ padding: 12, border: '1px solid var(--color-border)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ width: 24, height: 24, borderRadius: 50, background: statusClass === 'available' ? 'var(--color-success)' : 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>
                              {statusText.includes('generated') ? '✓' : '⏳'}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{langLabels[lang]}</span>
                          </div>

                          <div style={{ marginBottom: 8 }}>
                            <strong>Title:</strong> {langData.title || form.titleOriginal}
                          </div>
                          <div>
                            <strong>Description:</strong> {langData.description || form.descriptionOriginal}
                          </div>

                          {!langData.available && (
                            <button
                              style={{
                                marginTop: 6, width: '100%', padding: '6px 10px', background: 'var(--color-primary)',
                                color: '#fff', border: 'none', borderRadius: 6, fontSize: 11,
                                cursor: 'pointer',
                              }}
                              onClick={() => generateTranslations()}
                            >
                              Generate
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '12px 24px', background: 'var(--color-surface)', color: 'var(--text-primary)',
                    border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 14, textDecoration: 'none',
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Could submit to API; for now just close modal
                    onClose();
                  }}
                  style={{
                    flex: 1, padding: '12px 24px', background: 'var(--color-primary)', color: '#fff',
                    border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700,
                  }}
                >
                  {t('publishProductToMarketplace')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}