import { describe, expect, it } from 'vitest';
import { validateCreatePost } from './create-post.validation';

const NOW = new Date('2026-10-01T12:00:00Z');
const M1 = '3f0c6d3e-8a3b-4c3a-9a55-2b1f7c1e0a11';
const T1 = '7b1e0c2a-1111-4c3a-9a55-2b1f7c1e0a22';
const v = (body: unknown) => validateCreatePost(body, NOW);
const error = (body: unknown) => {
  const r = v(body);
  return r.ok ? null : r.error;
};

describe('validateCreatePost', () => {
  it('accepts a free text post and trims text', () => {
    const r = v({ accessMode: 'free', text: '  hello  ', mediaIds: [] });
    expect(r.ok && r.value.text).toBe('hello');
  });

  it('rejects an empty post', () => {
    expect(error({ accessMode: 'free', text: '   ', mediaIds: [] })).toBe('empty_post');
  });

  it('subscribers: optional min tier, must be a uuid', () => {
    const r = v({ accessMode: 'subscribers', mediaIds: [M1], minTierId: T1 });
    expect(r.ok && r.value.accessMode === 'subscribers' && r.value.minTierId).toBe(T1);
    expect(error({ accessMode: 'subscribers', mediaIds: [M1], minTierId: 'x' })).toBe('min_tier_invalid');
  });

  it('paid: integer price in minor units within range, known currency, needs media', () => {
    expect(v({ accessMode: 'paid', mediaIds: [M1], priceMinor: 2500, currency: 'AED' }).ok).toBe(true);
    expect(error({ accessMode: 'paid', mediaIds: [M1], priceMinor: 25.5, currency: 'AED' })).toBe('price_invalid');
    expect(error({ accessMode: 'paid', mediaIds: [M1], priceMinor: 99, currency: 'AED' })).toBe('price_out_of_range');
    expect(error({ accessMode: 'paid', mediaIds: [M1], priceMinor: 2500, currency: 'EUR' })).toBe('currency_invalid');
    expect(error({ accessMode: 'paid', text: 'x', mediaIds: [], priceMinor: 2500, currency: 'AED' })).toBe('paid_requires_media');
  });

  it('price is not allowed on free and subscriber posts', () => {
    expect(error({ accessMode: 'free', text: 'x', mediaIds: [], priceMinor: 100 })).toBe('price_not_allowed');
    expect(error({ accessMode: 'subscribers', text: 'x', mediaIds: [], priceMinor: 100 })).toBe('price_not_allowed');
  });

  it('rejects bad media ids, duplicates collapse, max 10', () => {
    expect(error({ accessMode: 'free', mediaIds: ['../etc'] })).toBe('media_ids_invalid');
    const r = v({ accessMode: 'free', mediaIds: [M1, M1] });
    expect(r.ok && r.value.mediaIds).toEqual([M1]);
  });

  it('schedule: not in the past, not further than 90 days', () => {
    expect(v({ accessMode: 'free', text: 'x', mediaIds: [], publishAt: '2026-10-02T12:00:00Z' }).ok).toBe(true);
    expect(error({ accessMode: 'free', text: 'x', mediaIds: [], publishAt: '2026-09-30T12:00:00Z' })).toBe('publish_at_in_past');
    expect(error({ accessMode: 'free', text: 'x', mediaIds: [], publishAt: '2027-03-01T12:00:00Z' })).toBe('publish_at_too_far');
  });

  it('rejects unknown access mode', () => {
    expect(error({ accessMode: 'secret', text: 'x', mediaIds: [] })).toBe('access_mode_invalid');
  });
});
