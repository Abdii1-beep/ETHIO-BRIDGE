'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ApiClientError } from '@/lib/api';

export function useErrorMessage() {
  const t = useTranslations('errors');

  return useCallback(
    (err: unknown): string => {
      if (err instanceof ApiClientError) {
        if (err.code === 'VALIDATION_FAILED' && err.details && err.details.length > 0) {
          return err.details.slice(0, 3).join('. ');
        }
        if (t.has(err.code)) {
          return t(err.code);
        }
        return err.message;
      }
      return t('generic');
    },
    [t],
  );
}