'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useTransition } from 'react';

const OPTIONS: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromoo' },
  { code: 'zh', label: '中文' },
];

export default function LanguageSwitcher() {
  const t = useTranslations('locale');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <select 
      value={locale} 
      onChange={onChange} 
      disabled={isPending}
      style={{
        padding: '4px 8px',
        borderRadius: '4px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        color: 'var(--text-primary)',
        fontSize: '13px',
        cursor: isPending ? 'not-allowed' : 'pointer'
      }}
    >
      {OPTIONS.map((option) => (
        <option key={option.code} value={option.code}>
          {option.label}
        </option>
      ))}
    </select>
  );
}