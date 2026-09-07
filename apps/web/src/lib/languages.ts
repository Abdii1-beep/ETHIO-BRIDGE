export const LANGUAGE_CODES = ['en', 'am', 'om', 'zh'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];