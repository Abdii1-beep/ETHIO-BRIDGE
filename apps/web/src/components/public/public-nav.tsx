'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import LanguageSwitcher from '../language-switcher';

const LINKS = [
  { href: '/#discover', label: 'Discover' },
  { href: '/#businesses', label: 'Businesses' },
  { href: '/#products', label: 'Products' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#for-businesses', label: 'For Businesses' },
];

export default function PublicNav() {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <nav className="pub-nav">
      <Link href="/" className="pub-nav-brand">
        <img src="/logo.png" alt="ETHIO-BRIDGE" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
        <span>
          ETHIO<span style={{ color: '#0D3B4E' }}>BRIDGE</span>
        </span>
      </Link>

      <div className="pub-nav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="pub-nav-link">
            {l.label}
          </Link>
        ))}
      </div>

      <div className="pub-nav-cta">
        <div className="lang-switch">
          <LanguageSwitcher />
        </div>
        <Link href="/login" className="btn btn-outline btn-sm">
          Sign In
        </Link>
        <Link href="/register" className="btn btn-primary btn-sm">
          Get Started
        </Link>
      </div>
    </nav>
  );
}
