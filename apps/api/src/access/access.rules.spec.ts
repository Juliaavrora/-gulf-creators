import { describe, expect, it } from 'vitest';
import { type ActiveGrant, canViewPost, type PostAccessInfo } from './access.rules';

const CREATOR = 'creator-1';
const OTHER_CREATOR = 'creator-2';
const FAN = 'fan-1';

const post = (over: Partial<PostAccessInfo> = {}): PostAccessInfo => ({
  id: 'post-1',
  creatorId: CREATOR,
  accessMode: 'subscribers',
  minTierLevel: 2,
  ...over,
});
const tierGrant = (level: number, creatorId = CREATOR): ActiveGrant => ({ postId: null, tier: { creatorId, level } });
const postGrant = (postId = 'post-1'): ActiveGrant => ({ postId, tier: null });

describe('canViewPost', () => {
  it('free post is visible to everyone, including anonymous', () => {
    expect(canViewPost(post({ accessMode: 'free' }), null, [])).toBe(true);
  });

  it('closed posts are hidden from anonymous viewers', () => {
    expect(canViewPost(post(), null, [])).toBe(false);
    expect(canViewPost(post({ accessMode: 'paid', minTierLevel: null }), null, [])).toBe(false);
  });

  it('creator always sees own posts', () => {
    expect(canViewPost(post({ accessMode: 'paid' }), CREATOR, [])).toBe(true);
  });

  it('subscriber post: tier level must be >= min tier', () => {
    expect(canViewPost(post({ minTierLevel: 2 }), FAN, [tierGrant(1)])).toBe(false);
    expect(canViewPost(post({ minTierLevel: 2 }), FAN, [tierGrant(2)])).toBe(true);
    expect(canViewPost(post({ minTierLevel: 2 }), FAN, [tierGrant(3)])).toBe(true);
  });

  it('subscriber post without min tier: any tier of this creator', () => {
    expect(canViewPost(post({ minTierLevel: null }), FAN, [tierGrant(1)])).toBe(true);
  });

  it("another creator's tier does not open the post", () => {
    expect(canViewPost(post(), FAN, [tierGrant(3, OTHER_CREATOR)])).toBe(false);
  });

  it('paid post opens only with a grant on that post, not with a subscription', () => {
    const paid = post({ accessMode: 'paid', minTierLevel: null });
    expect(canViewPost(paid, FAN, [tierGrant(3)])).toBe(false);
    expect(canViewPost(paid, FAN, [postGrant('post-2')])).toBe(false);
    expect(canViewPost(paid, FAN, [postGrant('post-1')])).toBe(true);
  });

  it('gift grant on a post opens a subscriber post without subscription', () => {
    expect(canViewPost(post(), FAN, [postGrant('post-1')])).toBe(true);
  });
});
