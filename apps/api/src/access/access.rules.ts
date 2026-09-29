/**
 * Единственное место, где решается «может ли зритель видеть пост» (см. CLAUDE.md, правило 2).
 * Решение принимается только по действующим access_grants зрителя — не по подпискам и не по покупкам.
 */

export interface PostAccessInfo {
  id: string;
  creatorId: string;
  accessMode: 'free' | 'subscribers' | 'paid';
  /** Уровень минимального тарифа; null — подходит любой тариф автора. */
  minTierLevel: number | null;
}

/** Действующий grant: не удалён и не истёк (фильтрует вызывающий код). */
export interface ActiveGrant {
  postId: string | null;
  tier: { creatorId: string; level: number } | null;
}

export function canViewPost(post: PostAccessInfo, viewerId: string | null, grants: ActiveGrant[]): boolean {
  if (post.accessMode === 'free') return true;
  if (!viewerId) return false;
  if (viewerId === post.creatorId) return true;

  // Grant на конкретный пост: покупка или подарок.
  if (grants.some((g) => g.postId === post.id)) return true;

  if (post.accessMode === 'subscribers') {
    const minLevel = post.minTierLevel ?? 1;
    return grants.some((g) => g.tier !== null && g.tier.creatorId === post.creatorId && g.tier.level >= minLevel);
  }

  // Платный пост открывается только grant-ом на сам пост.
  return false;
}
