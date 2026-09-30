import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { use } from 'react';
import { AuthButton } from '@/components/auth/auth-button';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { DevUserSwitcher } from '@/components/dev/dev-user-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations('Home');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-4 py-6">
      <header className="flex items-center justify-between gap-4">
        <span dir="ltr" className="font-brand text-3xl font-extrabold tracking-tight text-accent-fg">
          {t('title')}
        </span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <AuthButton />
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <span className="self-start rounded-lg bg-brand px-2.5 py-1 text-xs font-bold text-on-brand">
          {t('comingSoon')}
        </span>
        <h1 className="text-3xl font-extrabold leading-tight">{t('headline')}</h1>
        <p className="leading-relaxed text-muted">{t('description')}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="ps-1 text-sm font-semibold text-muted">{t('appearance')}</h2>
        <ThemeSwitcher />
      </section>

      <DevUserSwitcher />
    </main>
  );
}
