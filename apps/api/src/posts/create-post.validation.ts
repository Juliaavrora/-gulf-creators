import { CURRENCIES, type Currency } from '@gulf/shared';

export const POST_TEXT_MAX = 2200;
export const POST_MEDIA_MAX = 10;
/** Цена разового поста: от 1 до 5 000 в основной валюте (в минорных единицах). */
export const PAID_PRICE_MIN_MINOR = 100;
export const PAID_PRICE_MAX_MINOR = 500_000;
export const SCHEDULE_MAX_DAYS = 90;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export type ValidCreatePost = {
  text: string | null;
  mediaIds: string[];
  publishAt: Date;
} & (
  | { accessMode: 'free' }
  | { accessMode: 'subscribers'; minTierId: string | null }
  | { accessMode: 'paid'; priceMinor: number; currency: Currency }
);

export type ValidationResult = { ok: true; value: ValidCreatePost } | { ok: false; error: string };

/** Проверка тела запроса на создание поста. Не доверяет ничему из клиента. */
export function validateCreatePost(body: unknown, now = new Date()): ValidationResult {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'body_required' };
  const b = body as Record<string, unknown>;

  let text: string | null = null;
  if (b.text !== undefined && b.text !== null) {
    if (typeof b.text !== 'string') return { ok: false, error: 'text_invalid' };
    const trimmed = b.text.trim();
    if (trimmed.length > POST_TEXT_MAX) return { ok: false, error: 'text_too_long' };
    text = trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(b.mediaIds) || !b.mediaIds.every((id) => typeof id === 'string' && UUID.test(id))) {
    return { ok: false, error: 'media_ids_invalid' };
  }
  const mediaIds = [...new Set(b.mediaIds as string[])];
  if (mediaIds.length > POST_MEDIA_MAX) return { ok: false, error: 'too_many_media' };
  if (!text && mediaIds.length === 0) return { ok: false, error: 'empty_post' };

  let publishAt = now;
  if (b.publishAt !== undefined && b.publishAt !== null) {
    if (typeof b.publishAt !== 'string' || Number.isNaN(Date.parse(b.publishAt))) return { ok: false, error: 'publish_at_invalid' };
    publishAt = new Date(b.publishAt);
    if (publishAt.getTime() < now.getTime() - 60_000) return { ok: false, error: 'publish_at_in_past' };
    if (publishAt.getTime() > now.getTime() + SCHEDULE_MAX_DAYS * 86_400_000) return { ok: false, error: 'publish_at_too_far' };
  }

  const base = { text, mediaIds, publishAt };
  const hasPrice = b.priceMinor !== undefined && b.priceMinor !== null;

  switch (b.accessMode) {
    case 'free':
      if (hasPrice) return { ok: false, error: 'price_not_allowed' };
      return { ok: true, value: { ...base, accessMode: 'free' } };
    case 'subscribers': {
      if (hasPrice) return { ok: false, error: 'price_not_allowed' };
      const minTierId = b.minTierId ?? null;
      if (minTierId !== null && (typeof minTierId !== 'string' || !UUID.test(minTierId))) {
        return { ok: false, error: 'min_tier_invalid' };
      }
      return { ok: true, value: { ...base, accessMode: 'subscribers', minTierId } };
    }
    case 'paid': {
      const price = b.priceMinor;
      if (typeof price !== 'number' || !Number.isInteger(price)) return { ok: false, error: 'price_invalid' };
      if (price < PAID_PRICE_MIN_MINOR || price > PAID_PRICE_MAX_MINOR) return { ok: false, error: 'price_out_of_range' };
      if (!CURRENCIES.includes(b.currency as Currency)) return { ok: false, error: 'currency_invalid' };
      // Платному посту нужно медиа: у фаната должно быть размытое превью того, за что он платит.
      if (mediaIds.length === 0) return { ok: false, error: 'paid_requires_media' };
      return { ok: true, value: { ...base, accessMode: 'paid', priceMinor: price, currency: b.currency as Currency } };
    }
    default:
      return { ok: false, error: 'access_mode_invalid' };
  }
}
