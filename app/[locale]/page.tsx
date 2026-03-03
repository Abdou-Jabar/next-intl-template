import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { Link } from '@/i18n/navigation';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations('HomePage');
  return <main>
    <h1>{t('title')}</h1>
    <LocaleSwitcher />
    <Link href={"/dashboard"}>Page</Link>
  </main>
    
}