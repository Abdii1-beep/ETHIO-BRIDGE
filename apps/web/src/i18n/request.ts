import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import en from '../../messages/en.json';
import am from '../../messages/am.json';
import om from '../../messages/om.json';
import zh from '../../messages/zh.json';

// Helper to deep merge locale messages with English fallback
function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  if (!source) return target;
  const result: Record<string, any> = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

const messageMap: Record<string, typeof en> = {
  en,
  am: deepMerge(en, am) as typeof en,
  om: deepMerge(en, om) as typeof en,
  zh: deepMerge(en, zh) as typeof en,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: messageMap[locale] || en,
    onError(error) {
      // Log missing translations in development but don't throw
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[i18n]', error.message);
      }
    },
    getMessageFallback({ namespace, key }) {
      // Return a human-readable fallback instead of throwing
      return `${namespace}.${key}`;
    },
  };
});