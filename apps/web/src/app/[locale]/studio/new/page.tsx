import type { Locale, MeDto } from '@gulf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { NewPostForm } from '@/components/studio/new-post-form';
import { Link } from '@/i18n/navigation';
import { apiGet } from '@/lib/api';

// Страница зависит от того, кто вошёл, — никогда не собирать заранее.
export const dynamic = 'force-dynamic';

export default async function NewPostPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Studio');
  const me = await apiGet<MeDto>('/me');
  const creator = me?.creator;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-4 py-4">
      <header className="flex h-12 items-center justify-between">
        <Link href={creator ? `/${creator.handle}` : '/'} aria-label={t('close')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">{t('title')}</h1>
        <span className="w-10" />
      </header>

      {!me && <p className="rounded-2xl bg-surface p-4">{t('signInRequired')}</p>}
      {me && !creator && <p className="rounded-2xl bg-surface p-4">{t('creatorsOnly')}</p>}
      {creator && !creator.canPublish && <p className="rounded-2xl bg-surface p-4">{t('kycRequired')}</p>}
      {creator?.canPublish && <NewPostForm handle={creator.handle} tiers={creator.tiers} />}
    </main>
  );
}
