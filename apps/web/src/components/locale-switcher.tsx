import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const current = useLocale();
  const t = useTranslations('LocaleSwitcher');

  return (
    <nav aria-label={t('label')} className="flex gap-2 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href="/"
          locale={locale}
          aria-current={locale === current ? 'true' : undefined}
          className={
            locale === current
              ? 'rounded-md bg-neutral-900 px-3 py-1 text-white'
              : 'rounded-md border border-neutral-300 px-3 py-1 hover:bg-neutral-100'
          }
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
