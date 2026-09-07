import { Link } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';
import PublicNav from '@/components/public/public-nav';
import PublicFooter from '@/components/public/public-footer';

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="pub-body">
      <PublicNav />

      <section className="pub-section" style={{ paddingTop: 40 }}>
        <div className="pub-container">
          <span className="pub-kicker">Contact us</span>
          <h2>Get in touch</h2>
          <p>
            Whether you're a buyer looking for verified suppliers, a supplier wanting to
            list your products, or just have a question about our platform — we're here
            to help.
          </p>
        </div>
      </section>

      <section className="pub-section alt" style={{ paddingTop: 24, marginBottom: 32 }}>
        <div className="pub-container">
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>📧</div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Email</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>hello@ethio.bridge</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>General inquiries and partnership proposals</p>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>📞</div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Phone</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>+251 9 00 000 000</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Available 8 AM–6 PM EAT, Mon–Fri</p>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>📍</div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '4px' }}>Addresses</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Bole Road, Addis Ababa, Ethiopia</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Jinshi Road, Guangzhou, China</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Mailing: P.O. Box 12345, Addis Ababa</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-section" style={{ paddingTop: 32 }}>
        <div className="pub-container">
          <p style={{ textAlign: 'center', marginBottom: '20px', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
            Send us a message — our team typically replies within one business day.
          </p>
          <div style={{ display: 'inline-flex', gap: '12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '11px', padding: '10px 16px' }}>
            <a
              href="mailto:hello@ethio.bridge?subject=ETHIO-BRIDGE inquiry&body=Hello ETHIO-BRIDGE team,"
              style={{ display: 'inline-block', fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', textDecoration: 'none', padding: '8px 14px', borderRadius: '9px', marginRight: '8px' }}
            >
              Write to us
            </a>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>·</span>
            <a
              href="tel:+251900000000"
              style={{ display: 'inline-block', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', padding: '8px 14px', borderRadius: '9px' }}
            >
              Call us
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}