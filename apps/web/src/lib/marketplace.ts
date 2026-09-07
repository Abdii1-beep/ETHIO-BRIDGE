export const PRODUCT_CATEGORIES = [
  'Agriculture & Livestock',
  'Agro-processing & Machinery',
  'Coffee & Beverages',
  'Ceramics & Glass',
  'Textiles, Garments & Leather',
  'Wood & Wood Products',
  'Metals & Steel Products',
  'Electronics & IT',
  'Electrical & Solar Energy',
  'Construction & Building Materials',
  'Machinery & Industrial Equipment',
  'Automotive & Spare Parts',
  'Chemicals & Plastics',
  'Pharmaceuticals & Healthcare',
  'Packaging & Paper',
  'Furniture & Home Appliances',
  'Food Processing & Staples',
  'Jewellery & Precious Metals',
  'Gifts, Handcrafts & Art',
  'Logistics, Transport & Services',
] as const;

export const ORIGIN_COUNTRIES = [
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
] as const;

export const CURRENCY_CODES = [
  { code: 'USD', label: 'USD ($)' },
  { code: 'ETB', label: 'ETB (Br)' },
  { code: 'CNY', label: 'CNY (¥)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'GBP', label: 'GBP (£)' },
] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  ETB: 'Br',
  CNY: '¥',
  EUR: '€',
  GBP: '£',
};

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'CANCELLED',
  'COMPLETED',
] as const;

export function discountPct(price: number, compareAt: number | null | undefined): number {
  if (!compareAt || compareAt <= 0 || price <= 0 || price >= compareAt) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}