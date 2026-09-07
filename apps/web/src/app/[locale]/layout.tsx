import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import IntlClientProvider from '@/components/intl-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ETHIO-BRIDGE — Cross-Border Commercial & B2B Platform',
  description: 'AI-Powered Ethiopia-China Commercial & B2B Trading Platform connecting verified businesses, RFQs, logistics, and global settlements.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <IntlClientProvider locale={locale} messages={messages}>
          {children}
        </IntlClientProvider>
      </body>
    </html>
  );
}