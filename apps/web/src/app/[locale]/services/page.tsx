import { Link } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';
import PublicNav from '@/components/public/public-nav';
import PublicFooter from '@/components/public/public-footer';

const SERVICES = [
  { title: 'Global Marketplace', icon: '🌍', path: '/products', desc: 'List products, browse verified suppliers, multi-language descriptions, live view-count tracking, compare-at pricing with %-badge, and view sold-count.' },
  { title: 'RFQ Hub', icon: '📋', path: '/rfqs', desc: 'Post a request for quotation in any language. Suppliers reply with priced offers; platform auto-translates replies. Choose the best offer and open a Negotiation Room thread.' },
  { title: 'Negotiation Room', icon: '💬', path: '/messages', desc: 'Auto-translating chat in English, Chinese, Amharic and Afaan Oromo. Launch a scheduled Jitsi video meeting from any chat thread with one click. Accept invites, share screen, close deals.' },
  { title: 'Logistics & Tariff Calculator', icon: '🚢', path: '/logistics', desc: 'Origin → destination route calculator. Select countries (10 origins), products by category (20 categories), volume/weight. Returns total landed cost in USD and ETB — with line-item breakdown of duty, VAT, freight and product subtotal.' },
  { title: 'Orders & Payments', icon: '💳', path: '/wallet', desc: 'Track quotes → orders → payments with a financial ledger. Wallet supports multi-currency balances (ETB, USD, CNY). One-click subscription to seller stores; auto-deducted 2% platform commission.' },
  { title: 'Finance & Invoicing', icon: '📊', path: '/finance', desc: 'Generate PDF invoices from closed orders, view VAT compliance records, export CSV for accounting. Subscription plans managed per organization — monthly/annual with auto-renewal.' },
  { title: 'CRM Pipeline', icon: '🛠️', path: '/crm', desc: 'Deal stages from initial contact → quote → negotiation → closed‑won / closed‑lost. Team member assignments, activity logs, internal notes. Filter by source (RFQ / product / contact import).' },
  { title: 'Team & Permissions', icon: '👥', path: '/team', desc: 'Organization‑level roles (admin, editor, viewer, guest) with inherited project permissions. Invite teammates via email, set granular feature entitlements per user.' },
];

export default async function ServicesPage({
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
          <span className="pub-kicker">Our services</span>
          <h2>Everything you need to trade across borders</h2>
          <p className="pub-section-desc">
            Each service is a fully functional part of ETHIO-BRIDGE — nothing is a mock.
          </p>
          <div className="pub-grid cols-3">
            {SERVICES.map((s) => (
              <div key={s.title} className="pub-card" style={{ textAlign: 'center' }}>
                <div className="pub-card-icon" style={{ fontSize: 28, marginBottom: 14 }}>{s.icon}</div>
                <h3 style={{ fontSize: 15, marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>{s.desc}</p>
                <Link href={s.path} className="pub-card-link" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                  → Explore {s.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}