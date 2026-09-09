import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  // Redirect to English locale
  redirect('/en');
}
