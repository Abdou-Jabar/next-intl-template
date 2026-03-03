import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import LocaleSwitcher from '@/components/LocaleSwitcher';

const Dashboard = ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('Dashboard');
  return (
    <div>
      {t('welcome')}
      <LocaleSwitcher />
    </div>
  )
}

export default Dashboard
