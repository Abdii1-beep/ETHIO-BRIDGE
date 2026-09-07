'use client';

import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '../language-switcher';

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="pub-footer">
      <div className="pub-footer-grid">
        <div className="pub-footer-col">
          <div style={{ marginBottom: '16px' }}>
            <img src="/logo.png" alt="ETHIO-BRIDGE" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h4>Platform</h4>
          <ul>
            <li><Link href="/#discover">Discover Businesses</Link></li>
            <li><Link href="/#products">Products</Link></li>
            <li><Link href="/#services">Services</Link></li>
            <li><Link href="/#rfqs">RFQs</Link></li>
            <li><Link href="/#how-it-works">How It Works</Link></li>
          </ul>
        </div>

        <div className="pub-footer-col">
          <h4>Business</h4>
          <ul>
            <li><Link href="/#for-buyers">For Buyers</Link></li>
            <li><Link href="/#for-sellers">For Sellers</Link></li>
            <li><Link href="/#for-exporters">For Exporters</Link></li>
            <li><Link href="/#for-importers">For Importers</Link></li>
            <li><Link href="/#enterprise">Enterprise</Link></li>
          </ul>
        </div>

        <div className="pub-footer-col">
          <h4>AI</h4>
          <ul>
            <li><Link href="/#ai-assistant">AI Assistant</Link></li>
            <li><Link href="/#translation">Translation</Link></li>
            <li><Link href="/#matching">Business Matching</Link></li>
            <li><Link href="/#documents">Documents</Link></li>
            <li><Link href="/#intelligence">Market Intelligence</Link></li>
          </ul>
        </div>

        <div className="pub-footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/careers">Careers</Link></li>
            <li><Link href="/partners">Partners</Link></li>
          </ul>
        </div>

        <div className="pub-footer-col">
          <h4>Legal</h4>
          <ul>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/cookies">Cookies</Link></li>
            <li><Link href="/security">Security</Link></li>
          </ul>
        </div>
      </div>

      <div className="pub-footer-bottom">
        <span>© {year} ETHIO-BRIDGE. All rights reserved.</span>
      </div>
    </footer>
  );
}
