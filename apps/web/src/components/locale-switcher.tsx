import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const current = useLocale();
  const t = useTranslations('LocaleSwitcher');

  return (
    <nav aria-label={t('label')} className="flex gap-1 rounded-2xl bg-surface p-1 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href="/"
          locale={locale}
          aria-current={locale === current ? 'true' : undefined}
          className={
            locale === current
              ? 'flex h-9 items-center rounded-xl bg-fg px-3 font-semibold text-bg'
              : 'flex h-9 items-center rounded-xl px-3 font-semibold text-muted hover:text-fg'
          }
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
