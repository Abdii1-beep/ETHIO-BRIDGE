'use client';

import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

export default function IntlClientProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Record<string, unknown>;
  children: ReactNode;
}) {
  return (
    <NextIntlClientProvider
      locale={locale}
      timeZone="UTC"
      messages={messages}
      onError={(error) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[i18n client]', error.message);
        }
      }}
      getMessageFallback={({ namespace, key }) => `${namespace}.${key}`}
    >
      {children}
    </NextIntlClientProvider>
  );
}