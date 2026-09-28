import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { LocaleSwitcher } from '@/components/locale-switcher';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('Home');

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <LocaleSwitcher />
      </header>
      <p className="text-neutral-600">{t('description')}</p>
      {/* Логические отступы (ps/border-s) — в RTL полоса должна оказаться справа. */}
      <p className="border-s-4 border-emerald-600 ps-4 text-start">{t('rtlCheck')}</p>
    </main>
  );
}
