'use client';

import {
  type AccessMode,
  type CreatePostRequest,
  type CreatePostResponse,
  type Currency,
  parseMajorToMinor,
  type TierDto,
  type UploadedMediaDto,
} from '@gulf/shared';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { devUserHeaders } from '@/lib/dev-user';
import { PUBLIC_API_URL } from '@/lib/media-url';

type Upload = { key: string; objectUrl: string; status: 'uploading' | 'ready' | 'error'; mediaId?: string; error?: string };

const MODES: AccessMode[] = ['free', 'subscribers', 'paid'];
const MAX_FILES = 10;

async function errorCode(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: unknown };
    return typeof body.message === 'string' ? body.message : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function NewPostForm({ handle, tiers }: { handle: string; tiers: TierDto[] }) {
  const t = useTranslations('Studio');
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<AccessMode>('subscribers');
  const [minTierId, setMinTierId] = useState<string>('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency: Currency = tiers[0]?.currency ?? 'AED';

  // Освобождаем превью выбранных файлов при уходе со страницы.
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;
  useEffect(() => () => uploadsRef.current.forEach((u) => URL.revokeObjectURL(u.objectUrl)), []);

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list).slice(0, MAX_FILES - uploads.length);
    for (const file of files) {
      const key = `${file.name}-${file.size}-${Math.random()}`;
      setUploads((prev) => [...prev, { key, objectUrl: URL.createObjectURL(file), status: 'uploading' }]);
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await fetch(`${PUBLIC_API_URL}/media/uploads`, { method: 'POST', body: form, headers: devUserHeaders() });
        if (!res.ok) throw new Error(await errorCode(res));
        const media = (await res.json()) as UploadedMediaDto;
        setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, status: 'ready', mediaId: media.id } : u)));
      } catch (e) {
        const code = e instanceof Error ? e.message : 'unknown';
        setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, status: 'error', error: code } : u)));
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  function remove(key: string) {
    setUploads((prev) => {
      const u = prev.find((x) => x.key === key);
      if (u) URL.revokeObjectURL(u.objectUrl);
      return prev.filter((x) => x.key !== key);
    });
  }

  const uploading = uploads.some((u) => u.status === 'uploading');
  const mediaIds = uploads.filter((u) => u.status === 'ready' && u.mediaId).map((u) => u.mediaId!);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const body: CreatePostRequest = { text, accessMode: mode, mediaIds };
    if (mode === 'subscribers') body.minTierId = minTierId || null;
    if (mode === 'paid') {
      const minor = parseMajorToMinor(price);
      if (minor === null) {
        setError('price_invalid');
        return;
      }
      body.priceMinor = minor;
      body.currency = currency;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${PUBLIC_API_URL}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...devUserHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await errorCode(res));
      const created = (await res.json()) as CreatePostResponse;
      router.push({ pathname: `/${handle}`, query: created.moderationStatus === 'pending' ? { posted: 'pending' } : {} });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
      setSubmitting(false);
    }
  }

  const errorText = (code: string) => (t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.unknown'));

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex gap-2 overflow-x-auto">
        {uploads.map((u) => (
          <div key={u.key} className="relative h-36 w-28 shrink-0 overflow-hidden rounded-[18px] bg-surface">
            <img src={u.objectUrl} alt="" className={u.status === 'ready' ? 'h-full w-full object-cover' : 'h-full w-full object-cover opacity-50'} />
            {u.status === 'uploading' && (
              <span className="absolute inset-x-2 bottom-2 rounded-lg bg-scrim px-2 py-1 text-center text-[11px] font-semibold text-on-scrim">{t('uploading')}</span>
            )}
            {u.status === 'error' && (
              <span className="absolute inset-x-2 bottom-2 rounded-lg bg-scrim px-2 py-1 text-center text-[11px] font-semibold text-on-scrim">{errorText(u.error ?? 'unknown')}</span>
            )}
            <button
              type="button"
              onClick={() => remove(u.key)}
              aria-label={t('removePhoto')}
              className="absolute end-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-scrim text-on-scrim"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
        {uploads.length < MAX_FILES && (
          <label className="flex h-36 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-[18px] border-2 border-dashed border-line text-sm text-muted">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t('addPhoto')}
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
          </label>
        )}
      </div>

      <label className="flex flex-col gap-2">
        <span className="sr-only">{t('caption')}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={2200}
          dir="auto"
          placeholder={t('captionPlaceholder')}
          className="resize-none rounded-[18px] bg-surface px-4 py-3.5 leading-relaxed text-fg outline-none placeholder:text-muted focus:ring-2 focus:ring-accent-fg"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 ps-1 text-sm font-semibold text-muted">{t('whoCanSee')}</legend>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <label
              key={m}
              className={
                m === mode
                  ? 'flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[18px] bg-brand font-bold text-on-brand'
                  : 'flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-[18px] bg-surface font-bold text-fg'
              }
            >
              <input type="radio" name="mode" value={m} checked={m === mode} onChange={() => setMode(m)} className="sr-only" />
              {t(`mode.${m}`)}
            </label>
          ))}
        </div>

        {mode === 'subscribers' && tiers.length > 0 && (
          <label className="mt-1 flex min-h-14 items-center gap-3 rounded-[20px] bg-surface px-4">
            <span className="grow">{t('minTier')}</span>
            <select value={minTierId} onChange={(e) => setMinTierId(e.target.value)} className="bg-transparent font-bold text-accent-fg outline-none">
              <option value="">{t('allTiers')}</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {t('tierAndAbove', { name: tier.name })}
                </option>
              ))}
            </select>
          </label>
        )}

        {mode === 'paid' && (
          <label className="mt-1 flex min-h-14 items-center gap-3 rounded-[20px] bg-surface px-4">
            <span className="grow">{t('price')}</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              dir="ltr"
              placeholder="25"
              className="w-24 bg-transparent text-end text-lg font-bold outline-none"
            />
            <span className="text-muted">{currency}</span>
          </label>
        )}
      </fieldset>

      <p className="ps-1 text-xs leading-relaxed text-muted">{t('reviewNote')}</p>

      {error && (
        <p role="alert" className="rounded-2xl bg-surface px-4 py-3 text-sm font-semibold">
          {errorText(error)}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="h-13 rounded-[18px] bg-brand text-lg font-bold text-on-brand disabled:opacity-50"
      >
        {submitting ? t('publishing') : uploading ? t('waitUploads') : t('publish')}
      </button>
    </form>
  );
}
