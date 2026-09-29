import type { Locale, MeDto, ModerationItemDto } from '@gulf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ModerationCard } from '@/components/admin/moderation-card';
import { apiGet } from '@/lib/api';

// Зависит от того, кто вошёл, и от живой очереди.
export const dynamic = 'force-dynamic';

export default async function ModerationPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Moderation');
  const tHome = await getTranslations('Home');
  const me = await apiGet<MeDto>('/me');
  const isAdmin = me?.role === 'admin';
  const queue = isAdmin ? ((await apiGet<ModerationItemDto[]>('/admin/moderation/queue')) ?? []) : [];

  return (
    <div className="flex min-h-screen">
      <nav aria-label={t('nav.label')} className="hidden w-56 shrink-0 flex-col gap-1 border-e border-line p-4 md:flex">
        <span dir="ltr" className="mb-4 px-2 font-brand text-2xl font-extrabold tracking-tight text-accent-fg">
          {tHome('title')} <span className="font-sans text-xs font-semibold text-muted">{t('nav.admin')}</span>
        </span>
        <span aria-current="page" className="flex h-10 items-center justify-between rounded-xl bg-surface px-3 text-sm font-bold">
          {t('nav.moderation')}
          {queue.length > 0 && <span className="rounded-full bg-brand px-2 text-xs font-bold text-on-brand">{queue.length}</span>}
        </span>
        <span className="flex h-10 items-center px-3 text-sm text-muted">{t('nav.applications')}</span>
        <span className="flex h-10 items-center px-3 text-sm text-muted">{t('nav.finance')}</span>
      </nav>

      <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-extrabold">{t('title')}</h1>
          {isAdmin && <span className="text-sm text-muted">{t('queueCount', { count: queue.length })}</span>}
        </header>

        {!me && <p className="rounded-2xl bg-surface p-4">{t('signInRequired')}</p>}
        {me && !isAdmin && <p className="rounded-2xl bg-surface p-4">{t('adminsOnly')}</p>}
        {isAdmin && queue.length === 0 && <p className="rounded-2xl bg-surface p-6 text-center text-muted">{t('empty')}</p>}
        {isAdmin && queue.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {queue.map((item) => (
              <li key={item.postId} className="flex">
                <ModerationCard item={item} locale={locale} />
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">{t('auditNote')}</p>
      </main>
    </div>
  );
}
