import { formatMoney, type Locale, type PostDto } from '@gulf/shared';
import { useTranslations } from 'next-intl';
import { mediaUrl } from '@/lib/api';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function PostGrid({ posts, locale }: { posts: PostDto[]; locale: Locale }) {
  const t = useTranslations('Creator');

  if (posts.length === 0) {
    return <p className="px-4 py-10 text-center text-muted">{t('emptyPosts')}</p>;
  }

  return (
    <ul className="grid grid-cols-3 gap-1 px-4">
      {posts.map((post) => {
        const media = post.media[0];
        const src = media ? mediaUrl(media.path ?? media.previewPath) : null;
        return (
          <li key={post.id} className="relative h-40 overflow-hidden rounded-xl bg-surface">
            {src && <img src={src} alt={post.text ?? ''} className="h-full w-full object-cover" loading="lazy" />}
            {post.locked && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-scrim text-on-scrim">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={t('locked')}>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
              </span>
            )}
            {post.locked && post.accessMode === 'paid' && post.priceMinor !== null && post.currency && (
              <span className="absolute bottom-1.5 start-1.5 rounded-lg bg-brand px-2 py-0.5 text-[11px] font-bold text-on-brand">
                {formatMoney(post.priceMinor, post.currency, locale)}
              </span>
            )}
            {media?.kind === 'video' && media.duration !== null && (
              <span className="absolute bottom-1.5 end-1.5 rounded-md bg-scrim px-1.5 text-[11px] font-semibold text-on-scrim">
                <bdi dir="ltr">{formatDuration(media.duration)}</bdi>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
