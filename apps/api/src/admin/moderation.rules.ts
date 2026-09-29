import type { ModerationDecision } from '@gulf/shared';

export const HIDE_REASON_MIN = 5;
export const HIDE_REASON_MAX = 500;

export type ValidDecision = { decision: 'approve'; reason: string | null } | { decision: 'hide'; reason: string };

export function validateDecision(body: unknown): { ok: true; value: ValidDecision } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null) return { ok: false, error: 'body_required' };
  const b = body as Record<string, unknown>;
  const reason = typeof b.reason === 'string' ? b.reason.trim() : null;
  if (b.reason !== undefined && b.reason !== null && typeof b.reason !== 'string') return { ok: false, error: 'reason_invalid' };
  if (reason && reason.length > HIDE_REASON_MAX) return { ok: false, error: 'reason_too_long' };

  const decision = b.decision as ModerationDecision;
  if (decision === 'approve') return { ok: true, value: { decision, reason: reason || null } };
  if (decision === 'hide') {
    // SPEC: автор видит причину и может подать апелляцию — без причины скрывать нельзя.
    if (!reason || reason.length < HIDE_REASON_MIN) return { ok: false, error: 'reason_required' };
    return { ok: true, value: { decision, reason } };
  }
  return { ok: false, error: 'decision_invalid' };
}

/**
 * Дата публикации после одобрения: пост, который ждал проверки, появляется в ленте «сейчас»,
 * а не задним числом; отложенный пост сохраняет свою будущую дату.
 */
export function publishedAtAfterApproval(scheduledAt: Date | null, now: Date): Date {
  return scheduledAt && scheduledAt.getTime() > now.getTime() ? scheduledAt : now;
}
