'use client';

import { formatMoney, type Locale, type ModerationDecisionRequest, type ModerationItemDto } from '@gulf/shared';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiHeaders } from '@/lib/api-headers';
import { mediaUrl, PUBLIC_API_URL } from '@/lib/media-url';

export function ModerationCard({ item, locale }: { item: ModerationItemDto; locale: Locale }) {
  const t = useTranslations('Moderation');
  const router = useRouter();
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(body: ModerationDecisionRequest) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${PUBLIC_API_URL}/admin/moderation/posts/${item.postId}/decision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(await apiHeaders()) },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(typeof data.message === 'string' ? data.message : 'unknown');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
      setBusy(false);
    }
  }

  const reasonLabel = item.reason === 'first_posts' ? t('reason.first_posts', { n: item.creatorPostNumber }) : t('reason.auto_flagged');
  const access =
    item.accessMode === 'paid' && item.priceMinor !== null && item.currency
      ? formatMoney(item.priceMinor, item.currency, locale)
      : t(`access.${item.accessMode}`);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-bg">
      <div className="flex gap-0.5 bg-surface">
        {item.media.length === 0 && <div className="flex h-44 w-full items-center justify-center text-sm text-muted">{t('textOnly')}</div>}
        {item.media.map((m) => (
          <img key={m.id} src={mediaUrl(m.path)} alt="" className="h-44 min-w-0 flex-1 object-cover" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span dir="ltr" className="font-bold">@{item.creator.handle}</span>
          <span className="text-muted">{access}</span>
        </div>
        <span className="self-start rounded-md bg-surface px-2 py-0.5 text-xs font-semibold">{reasonLabel}</span>
        {item.text && (
          <p dir="auto" className="line-clamp-3 text-sm leading-relaxed">
            {item.text}
          </p>
        )}

        {hiding && (
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t('hideReason')}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              dir="auto"
              placeholder={t('hideReasonPlaceholder')}
              className="resize-none rounded-xl bg-surface px-3 py-2 text-sm text-fg outline-none focus:ring-2 focus:ring-accent-fg"
            />
          </label>
        )}
        {error && (
          <p role="alert" className="text-xs font-semibold">
            {t.has(`errors.${error}`) ? t(`errors.${error}`) : t('errors.unknown')}
          </p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          {!hiding ? (
            <>
              <button type="button" disabled={busy} onClick={() => decide({ decision: 'approve' })} className="h-10 rounded-xl bg-brand text-sm font-bold text-on-brand disabled:opacity-50">
                {t('approve')}
              </button>
              <button type="button" disabled={busy} onClick={() => setHiding(true)} className="h-10 rounded-xl bg-surface text-sm font-bold disabled:opacity-50">
                {t('hide')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy || reason.trim().length < 5}
                onClick={() => decide({ decision: 'hide', reason })}
                className="h-10 rounded-xl bg-fg text-sm font-bold text-bg disabled:opacity-50"
              >
                {t('confirmHide')}
              </button>
              <button type="button" disabled={busy} onClick={() => setHiding(false)} className="h-10 rounded-xl bg-surface text-sm font-bold">
                {t('cancel')}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
