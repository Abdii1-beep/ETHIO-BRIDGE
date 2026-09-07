/**
 * Supported languages (SDD §21–22). Codes: en, am, om, zh.
 */

export interface LanguageDef {
  code: string;
  name: string; // English name, e.g. "English"
  nativeName: string; // name in its own script
  default?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageDef[] = [
  { code: 'en', name: 'English', nativeName: 'English', default: true },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'om', name: 'Afaan Oromo', nativeName: 'Afaan Oromoo' },
  { code: 'zh', name: 'Simplified Chinese', nativeName: '简体中文' },
];

export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

export const DEFAULT_LANGUAGE = 'en';

export function isSupportedLanguage(code: string): boolean {
  return LANGUAGE_CODES.includes(code);
}