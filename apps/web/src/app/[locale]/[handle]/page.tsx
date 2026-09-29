import { type CreatorProfileDto, formatMoney, type Locale, type PostDto, type PostFilter } from '@gulf/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PostGrid } from '@/components/creator/post-grid';
import { Link } from '@/i18n/navigation';
import { apiGet, mediaUrl } from '@/lib/api';

type Params = Promise<{ locale: Locale; handle: string }>;
type SearchParams = Promise<{ filter?: string }>;

const FILTERS: PostFilter[] = ['all', 'video', 'paid'];

function getProfile(handle: string) {
  return apiGet<CreatorProfileDto>(`/creators/${encodeURIComponent(handle)}`);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(decodeURIComponent(handle));
  if (!profile) return {};
  const t = await getTranslations('Creator');
  return { title: t('metaTitle', { name: profile.displayName, handle: profile.handle }) };
}

export default async function CreatorPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { locale, handle: rawHandle } = await params;
  setRequestLocale(locale);
  const handle = decodeURIComponent(rawHandle);
  const { filter: rawFilter } = await searchParams;
  const filter: PostFilter = FILTERS.includes(rawFilter as PostFilter) ? (rawFilter as PostFilter) : 'all';

  const [profile, posts] = await Promise.all([
    getProfile(handle),
    apiGet<PostDto[]>(`/creators/${encodeURIComponent(handle)}/posts?filter=${filter}`),
  ]);
  if (!profile || !posts) notFound();

  const t = await getTranslations('Creator');
  const cheapest = profile.tiers[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col pb-10">
      <div className="h-48 bg-surface">
        {profile.coverPath && <img src={mediaUrl(profile.coverPath)} alt="" className="h-full w-full object-cover" />}
      </div>

      <section className="relative -mt-12 flex flex-col gap-2.5 px-4">
        <div className="h-24 w-24 rounded-[30px] bg-brand p-[3px]">
          {profile.avatarPath ? (
            <img src={mediaUrl(profile.avatarPath)} alt={profile.displayName} className="h-full w-full rounded-[27px] border-[3px] border-bg object-cover" />
          ) : (
            <span className="block h-full w-full rounded-[27px] border-[3px] border-bg bg-surface-2" />
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <h1 dir="auto" className="text-2xl font-extrabold tracking-tight">{profile.displayName}</h1>
            <svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-label={t('verified')} className="text-accent-fg">
              <path fill="currentColor" d="M12 2.5l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 21.5l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" />
              <path d="M8 12.2l2.7 2.7 5.3-5.6" fill="none" className="stroke-bg" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span dir="ltr" className="self-start text-sm text-muted">@{profile.handle}</span>
        </div>

        {profile.bio && <p dir="auto" className="leading-relaxed text-fg/90">{profile.bio}</p>}

        <div className="flex flex-wrap gap-1.5 text-[13px] text-muted">
          <span className="rounded-xl bg-surface px-3 py-1.5">{t('posts', { count: profile.stats.posts })}</span>
          <span className="rounded-xl bg-surface px-3 py-1.5">{t('videos', { count: profile.stats.videos })}</span>
        </div>

        {cheapest && (
          <a href="#tiers" className="mt-1 flex h-13 items-center justify-center rounded-[18px] bg-brand font-bold text-on-brand">
            {t('subscribeFrom', { price: formatMoney(cheapest.priceMinor, cheapest.currency, locale) })}
          </a>
        )}
      </section>

      {profile.tiers.length > 0 && (
        <section id="tiers" className="mt-6 flex flex-col gap-2.5">
          <h2 className="px-4 text-lg font-bold">{t('tiers')}</h2>
          <ul className="flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
            {profile.tiers.map((tier) => (
              <li key={tier.id} className="flex w-56 shrink-0 snap-start flex-col gap-1.5 rounded-[20px] border-2 border-surface-2 bg-surface p-3.5">
                <span dir="auto" className="text-sm font-semibold text-muted">{tier.name}</span>
                <span className="text-[26px] font-extrabold leading-tight tracking-tight">
                  {formatMoney(tier.priceMinor, tier.currency, locale)}
                  <span className="ms-1 text-[13px] font-normal text-muted">{t('perMonth')}</span>
                </span>
                {tier.perks.length > 0 && <span dir="auto" className="text-[13px] leading-normal text-fg/90">{tier.perks.join(' · ')}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label={t('filterLabel')} className="mx-4 mb-3 mt-6 grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={{ pathname: `/${handle}`, query: f === 'all' ? {} : { filter: f } }}
            aria-current={f === filter ? 'page' : undefined}
            className={
              f === filter
                ? 'flex h-9 items-center justify-center rounded-xl bg-fg text-sm font-semibold text-bg'
                : 'flex h-9 items-center justify-center rounded-xl text-sm font-semibold text-muted hover:text-fg'
            }
          >
            {t(`filter.${f}`)}
          </Link>
        ))}
      </nav>

      <PostGrid posts={posts} locale={locale} />
    </main>
  );
}
