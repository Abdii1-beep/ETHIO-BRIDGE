export function initials(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function formatDate(iso: string, locale = 'en'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return date.toLocaleDateString();
  }
}