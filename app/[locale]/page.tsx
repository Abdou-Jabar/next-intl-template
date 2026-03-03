import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LocaleSwitcher';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations('HomePage');
  return <main>
    <h1>{t('title')}</h1>
    <LocaleSwitcher />
  </main>
    
}