import { Injectable } from '@nestjs/common';
import type { CreatorProfileDto, Currency, PostDto, PostFilter } from '@gulf/shared';
import type { Prisma } from '@gulf/db';
import { AccessService } from '../access/access.service';
import { PrismaService } from '../prisma/prisma.service';

/** Пост виден публично: опубликован, не удалён, прошёл модерацию (flagged — опубликован с пометкой). */
export function visiblePostWhere(creatorId: string): Prisma.PostWhereInput {
  return {
    creatorId,
    deletedAt: null,
    publishedAt: { lte: new Date() },
    moderationStatus: { in: ['approved', 'flagged'] },
  };
}

function perksOf(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

@Injectable()
export class CreatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  private findApproved(handle: string) {
    return this.prisma.client.creatorProfile.findFirst({
      where: { handle, deletedAt: null, status: 'approved' },
    });
  }

  async profile(handle: string): Promise<CreatorProfileDto | null> {
    const creator = await this.findApproved(handle);
    if (!creator) return null;
    const visible = visiblePostWhere(creator.userId);
    const [tiers, posts, videos] = await Promise.all([
      this.prisma.client.subscriptionTier.findMany({
        where: { creatorId: creator.userId, deletedAt: null, isActive: true },
        orderBy: { level: 'asc' },
      }),
      this.prisma.client.post.count({ where: visible }),
      this.prisma.client.post.count({ where: { ...visible, media: { some: { kind: 'video', deletedAt: null } } } }),
    ]);
    return {
      handle: creator.handle,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarPath: creator.avatarUrl ? `/media/profile/${creator.handle}/avatar` : null,
      coverPath: creator.coverUrl ? `/media/profile/${creator.handle}/cover` : null,
      stats: { posts, videos },
      tiers: tiers.map((t) => ({
        id: t.id,
        level: t.level,
        name: t.name,
        priceMinor: t.priceMinor,
        currency: t.currency as Currency,
        perks: perksOf(t.perks),
      })),
    };
  }

  async posts(handle: string, viewerId: string | null, filter: PostFilter): Promise<PostDto[] | null> {
    const creator = await this.findApproved(handle);
    if (!creator) return null;
    const where: Prisma.PostWhereInput = { ...visiblePostWhere(creator.userId) };
    if (filter === 'video') where.media = { some: { kind: 'video', deletedAt: null } };
    if (filter === 'paid') where.accessMode = 'paid';

    const posts = await this.prisma.client.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: 60,
      include: {
        minTier: { select: { level: true } },
        media: { where: { deletedAt: null, status: 'ready' }, orderBy: { createdAt: 'asc' } },
      },
    });
    const unlocked = await this.access.unlockedPostIds(
      viewerId,
      posts.map((p) => ({ id: p.id, creatorId: p.creatorId, accessMode: p.accessMode, minTierLevel: p.minTier?.level ?? null })),
    );

    return posts.map((p) => {
      const open = unlocked.has(p.id);
      return {
        id: p.id,
        accessMode: p.accessMode,
        minTierLevel: p.minTier?.level ?? null,
        priceMinor: p.priceMinor,
        currency: (p.currency as Currency | null) ?? null,
        publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
        locked: !open,
        text: open ? p.text : null,
        media: p.media.map((m) => ({
          id: m.id,
          kind: m.kind,
          duration: m.duration,
          previewPath: `/media/${m.id}/preview`,
          path: open ? `/media/${m.id}` : null,
        })),
      };
    });
  }
}
