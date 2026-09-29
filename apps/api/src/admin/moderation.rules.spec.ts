import { describe, expect, it } from 'vitest';
import { publishedAtAfterApproval, validateDecision } from './moderation.rules';

describe('validateDecision', () => {
  it('approve needs no reason', () => {
    expect(validateDecision({ decision: 'approve' })).toEqual({ ok: true, value: { decision: 'approve', reason: null } });
  });
  it('hide requires a meaningful reason (creator will see it)', () => {
    expect(validateDecision({ decision: 'hide' })).toEqual({ ok: false, error: 'reason_required' });
    expect(validateDecision({ decision: 'hide', reason: '  no ' })).toEqual({ ok: false, error: 'reason_required' });
    expect(validateDecision({ decision: 'hide', reason: ' Swimwear in frame ' })).toEqual({ ok: true, value: { decision: 'hide', reason: 'Swimwear in frame' } });
  });
  it('rejects unknown decisions and bad reasons', () => {
    expect(validateDecision({ decision: 'delete' })).toEqual({ ok: false, error: 'decision_invalid' });
    expect(validateDecision({ decision: 'hide', reason: 42 })).toEqual({ ok: false, error: 'reason_invalid' });
    expect(validateDecision({ decision: 'hide', reason: 'x'.repeat(501) })).toEqual({ ok: false, error: 'reason_too_long' });
  });
});

describe('publishedAtAfterApproval', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  it('a post that waited for review goes live now, not back-dated', () => {
    expect(publishedAtAfterApproval(new Date('2026-10-01T08:00:00Z'), now)).toEqual(now);
    expect(publishedAtAfterApproval(null, now)).toEqual(now);
  });
  it('a scheduled post keeps its future date', () => {
    const later = new Date('2026-10-05T18:00:00Z');
    expect(publishedAtAfterApproval(later, now)).toEqual(later);
  });
});
