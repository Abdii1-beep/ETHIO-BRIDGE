import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import PublicNav from '@/components/public/public-nav';
import PublicFooter from '@/components/public/public-footer';

const FEATURES = [
  { icon: '🌍', title: 'Verified Global Marketplace', desc: 'Publish and discover B2B products with full multi-language listings, images, video and live view counts.' },
  { icon: '📋', title: 'RFQ Hub', desc: 'Post a request for quotation and let verified suppliers compete for your business in one place.' },
  { icon: '💬', title: 'Negotiation Room', desc: 'Real-time chat that auto-translates English, Chinese, Amharic and Afaan Oromo — plus scheduled video meetings.' },
  { icon: '🚢', title: 'Logistics & Tariff Calculator', desc: 'Estimate routes, Ethiopian import duties and total landed cost in USD and ETB before you commit.' },
  { icon: '🤝', title: 'Orders & Payments', desc: 'Turn negotiated quotes into tracked orders with financial records your team can audit.' },
  { icon: '🔒', title: 'Trusted by Design', desc: 'Role-based access, immutable audit log, feature entitlements and ETHIO-BRIDGE 2% commission model.' },
];

const STEPS = [
  { n: '01', t: 'step1Title', d: 'step1Desc' },
  { n: '02', t: 'step2Title', d: 'step2Desc' },
  { n: '03', t: 'step3Title', d: 'step3Desc' },
  { n: '04', t: 'step4Title', d: 'step4Desc' },
];

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('common');
  const auth = await getTranslations('auth');

  return (
    <div className="pub-body">
      <PublicNav />

      {/* ───── Hero ───── */}
      <section className="pub-hero">
        <div className="pub-hero-blob" style={{ width: 420, height: 420, background: '#0D3B4E', top: -140, right: -80 }} />
        <div className="pub-hero-blob" style={{ width: 360, height: 360, background: '#15803D', bottom: -160, left: -100 }} />

        <span className="pub-hero-badge">{t('heroBadge')}</span>
        <h1 className="pub-hero-title">
          {t('heroTitle')}
          <span className="grad">{t('heroSubtitle')}</span>
        </h1>
        <p className="pub-hero-sub">
          {t('heroDescription')}
        </p>

        <div className="pub-hero-actions">
          <Link
            href="/register"
            className="btn"
            style={{ padding: '14px 32px', fontSize: 16, fontWeight: 700, borderRadius: '12px', background: '#F59E0B', color: '#0A1F2C', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}
          >
            {t('startBusiness')}
          </Link>
          <Link
            href="/#businesses"
            className="btn"
            style={{ padding: '14px 32px', fontSize: 16, fontWeight: 700, borderRadius: '12px', background: '#fff', border: '2px solid #0D3B4E', color: '#0D3B4E' }}
          >
            {t('exploreBusinesses')}
          </Link>
        </div>

        <div className="pub-hero-trust">
          <span>{t('trustDiscovery')}</span>
          <span>{t('aiPowered')}</span>
          <span>{t('fourLanguages')}</span>
          <span>{t('businessPrivacy')}</span>
          <span>{t('builtToScale')}</span>
        </div>
      </section>

      {/* ───── Business Search ───── */}
      <section className="pub-section" id="businesses">
        <div className="pub-container">
          <span className="pub-kicker">{t('findRightBusiness')}</span>
          <h2>{t('discoverSuppliers')}</h2>
          <p className="pub-section-desc">
            {t('searchAcross')}
          </p>
          
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            marginBottom: '48px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                style={{
                  flex: 1,
                  minWidth: '280px',
                  padding: '16px 20px',
                  fontSize: '16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  outline: 'none',
                  background: 'var(--color-surface-2)'
                }}
              />
              <button className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px', fontWeight: 700 }}>
                {t('searchButton')}
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              <span>{t('popular')}</span>
              <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{t('solarPumps')}</a>
              <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{t('agriMachinery')}</a>
              <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{t('coffeeSuppliers')}</a>
              <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{t('electronics')}</a>
              <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{t('construction')}</a>
            </div>
          </div>

          {/* Cross-Language Search Demo */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-primary) 100%)',
            borderRadius: 'var(--radius-2xl)',
            padding: '48px',
            color: 'white',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('searchAcrossLanguages')}
            </h3>
            <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
              {t('searchAcrossLanguagesDesc')}
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>English</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>Solar Water Pump</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>中文</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>太阳能水泵</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>አማርኛ</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>የፀሐይ ውሃ ፓምፕ</div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>Afaan Oromoo</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>Pampii bishaanii humna aduu</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section className="pub-section alt" id="discover">
        <div className="pub-container">
          <span className="pub-kicker">{t('everythingInOnePlace')}</span>
          <h2>{t('builtForCommerce')}</h2>
          <p className="pub-section-desc">
            {t('builtForCommerceDesc')}
          </p>
          <div className="pub-grid cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="pub-card">
                <div className="pub-card-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                <Link href="/services" className="pub-card-link">
                  {t('learnMore')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Ethiopia ↔ China Section ───── */}
      <section className="pub-section" id="ethiopia-china">
        <div className="pub-container">
          <span className="pub-kicker">{t('oneBridge')}</span>
          <h2>{t('connectingEthiopiaChina')}</h2>
          <p className="pub-section-desc">
            {t('connectingEthiopiaChinaDesc')}
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '48px',
            alignItems: 'center',
            margin: '48px 0'
          }}>
            {/* Ethiopia Side */}
            <div style={{
              background: 'var(--color-surface)',
              border: '2px solid #15803D',
              borderRadius: 'var(--radius-2xl)',
              padding: '32px',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <span style={{ fontSize: '32px' }}>🇪🇹</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#15803D' }}>Ethiopia</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#15803D' }}>✓</span> {t('exportProducts')}
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#15803D' }}>✓</span> {t('findBuyers')}
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#15803D' }}>✓</span> {t('findSuppliers')}
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#15803D' }}>✓</span> {t('promoteBusinesses')}
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#15803D' }}>✓</span> {t('createRFQs')}
                </li>
                <li style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#15803D' }}>✓</span> {t('connectGlobally')}
                </li>
              </ul>
            </div>

            {/* Bridge */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0D3B4E, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 800,
                boxShadow: 'var(--shadow-lg)'
              }}>
                EB
              </div>
              <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t('aiTranslation')}<br />
                {t('aiMatching')}<br />
                {t('aiCommunication')}<br />
                {t('aiDiscovery')}
              </div>
            </div>

            {/* China Side */}
            <div style={{
              background: 'var(--color-surface)',
              border: '2px solid #F59E0B',
              borderRadius: 'var(--radius-2xl)',
              padding: '32px',
              boxShadow: 'var(--shadow-md)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <span style={{ fontSize: '32px' }}>🇨🇳</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#F59E0B' }}>China</h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#F59E0B' }}>✓</span> {t('manufacturers')}
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#F59E0B' }}>✓</span> {t('suppliers')}
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#F59E0B' }}>✓</span> {t('technology')}
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#F59E0B' }}>✓</span> {t('machinery')}
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#F59E0B' }}>✓</span> {t('products')}
                </li>
                <li style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#F59E0B' }}>✓</span> {t('businessOpportunities')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───── AI Differentiator Section ───── */}
      <section className="pub-section alt" id="ai">
        <div className="pub-container">
          <span className="pub-kicker">{t('aiThatUnderstands')}</span>
          <h2>{t('intelligentTools')}</h2>
          <p className="pub-section-desc">
            {t('intelligentToolsDesc')}
          </p>
          
          <div className="pub-grid cols-3">
            <div className="pub-card">
              <div className="pub-card-icon">🌐</div>
              <h3>{t('aiTranslate')}</h3>
              <p>{t('aiTranslateDesc')}</p>
            </div>
            <div className="pub-card">
              <div className="pub-card-icon">🎯</div>
              <h3>{t('aiMatch')}</h3>
              <p>{t('aiMatchDesc')}</p>
            </div>
            <div className="pub-card">
              <div className="pub-card-icon">✨</div>
              <h3>{t('aiCreate')}</h3>
              <p>{t('aiCreateDesc')}</p>
            </div>
            <div className="pub-card">
              <div className="pub-card-icon">📄</div>
              <h3>{t('aiUnderstand')}</h3>
              <p>{t('aiUnderstandDesc')}</p>
            </div>
            <div className="pub-card">
              <div className="pub-card-icon">💼</div>
              <h3>{t('aiAssist')}</h3>
              <p>{t('aiAssistDesc')}</p>
            </div>
            <div className="pub-card">
              <div className="pub-card-icon">📊</div>
              <h3>{t('aiAnalyze')}</h3>
              <p>{t('aiAnalyzeDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section className="pub-section" id="how-it-works">
        <div className="pub-container">
          <span className="pub-kicker">{t('howItWorks')}</span>
          <h2>{t('fromLeadToShipment')}</h2>
          <p className="pub-section-desc">
            {t('fromLeadToShipmentDesc')}
          </p>
          <div className="pub-grid cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="pub-card" style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    margin: '0 auto 12px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#1e40af,#3b82f6)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 14,
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ fontSize: 15 }}>{t(s.t)}</h3>
                <p>{t(s.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Marketplace Preview ───── */}
      <section className="pub-section alt" id="products">
        <div className="pub-container">
          <span className="pub-kicker">{t('productDiscovery')}</span>
          <h2>{t('exploreMarketplace')}</h2>
          <p className="pub-section-desc">
            {t('exploreMarketplaceDesc')}
          </p>
          
          <div className="pub-grid cols-3">
            <div className="pub-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                height: '180px',
                background: 'linear-gradient(135deg, #E0F2FE, #DBEAFE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px'
              }}>
                💧
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🇨🇳</span>
                  <span className="badge" style={{ background: '#F59E0B', color: '#0A1F2C' }}>China</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{t('solarWaterPump')}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t('solarWaterPumpDesc')}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: '#15803D', fontWeight: 600 }}>✓ {t('verified')}</span>
                  <span style={{ color: '#0D3B4E', fontWeight: 600 }}>{t('moq')}</span>
                </div>
              </div>
            </div>

            <div className="pub-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                height: '180px',
                background: 'linear-gradient(135deg, #DCFCE7, #D1FAE5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px'
              }}>
                ☕
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🇪🇹</span>
                  <span className="badge" style={{ background: '#15803D', color: '#fff' }}>Ethiopia</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{t('ethiopianCoffee')}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t('ethiopianCoffeeDesc')}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: '#15803D', fontWeight: 600 }}>✓ {t('verified')}</span>
                  <span style={{ color: '#0D3B4E', fontWeight: 600 }}>{t('exportAvailable')}</span>
                </div>
              </div>
            </div>

            <div className="pub-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                height: '180px',
                background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px'
              }}>
                ⚙️
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🇨🇳</span>
                  <span className="badge" style={{ background: '#F59E0B', color: '#0A1F2C' }}>China</span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{t('agriMachineryCard')}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{t('agriMachineryCardDesc')}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: '#15803D', fontWeight: 600 }}>✓ {t('verified')}</span>
                  <span style={{ color: '#0D3B4E', fontWeight: 600 }}>{t('moq50')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Trust Section ───── */}
      <section className="pub-section" id="trust">
        <div className="pub-container">
          <span className="pub-kicker">{t('knowWhoYoureDoingBusinessWith')}</span>
          <h2>{t('trustAndVerification')}</h2>
          <p className="pub-section-desc">
            {t('trustAndVerificationDesc')}
          </p>
          
          <div className="pub-grid cols-2">
            <div className="pub-card">
              <div className="pub-card-icon">🔐</div>
              <h3>{t('businessVerification')}</h3>
              <p>{t('businessVerificationDesc')}</p>
            </div>
            <div className="pub-card">
              <div className="pub-card-icon">📊</div>
              <h3>{t('transactionHistory')}</h3>
              <p>{t('transactionHistoryDesc')}</p>
            </div>
            <div className="pub-card">
              <div className="pub-card-icon">⭐</div>
              <h3>{t('reviewsAndRatings')}</h3>
              <p>{t('reviewsAndRatingsDesc')}</p>
            </div>
            <div className="pub-card">
              <div className="pub-card-icon">🛡️</div>
              <h3>{t('riskSignals')}</h3>
              <p>{t('riskSignalsDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── CTA band ───── */}
      <section className="pub-section" style={{ paddingTop: 24 }} id="for-businesses">
        <div className="pub-container">
          <div className="pub-cta-band">
            <h2>{t('buildYourNextConnection')}</h2>
            <p>
              {t('buildYourNextConnectionDesc')}
            </p>
            <div className="pub-hero-actions">
              <Link
                href="/register"
                className="btn"
                style={{ background: '#F59E0B', color: '#0A1F2C', fontWeight: 800, borderRadius: '12px', padding: '14px 28px' }}
              >
                {t('createBusinessAccount')}
              </Link>
              <Link
                href="/#businesses"
                className="btn"
                style={{ border: '2px solid #0D3B4E', color: '#0D3B4E', fontWeight: 700, borderRadius: '12px', padding: '14px 28px', background: '#fff' }}
              >
                {t('exploreBusinessHub')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}