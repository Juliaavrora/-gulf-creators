import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { type ActiveGrant, canViewPost, type PostAccessInfo } from './access.rules';

/** Загружает действующие access_grants зрителя и применяет правила из access.rules. */
@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async unlockedPostIds(viewerId: string | null, posts: PostAccessInfo[]): Promise<Set<string>> {
    const grants = viewerId ? await this.activeGrants(viewerId, posts) : [];
    return new Set(posts.filter((p) => canViewPost(p, viewerId, grants)).map((p) => p.id));
  }

  private async activeGrants(viewerId: string, posts: PostAccessInfo[]): Promise<ActiveGrant[]> {
    if (posts.length === 0) return [];
    const creatorIds = [...new Set(posts.map((p) => p.creatorId))];
    return this.prisma.client.accessGrant.findMany({
      where: {
        fanId: viewerId,
        deletedAt: null,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          { OR: [{ postId: { in: posts.map((p) => p.id) } }, { tier: { creatorId: { in: creatorIds } } }] },
        ],
      },
      select: { postId: true, tier: { select: { creatorId: true, level: true } } },
    });
  }
}
