import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import type { CreatePostResponse } from '@gulf/shared';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { StudioService } from '../viewer/studio.service';
import { validateCreatePost } from './create-post.validation';

/** SPEC: первые 5 постов каждого нового автора модератор смотрит до публикации. */
export const MANUAL_REVIEW_FIRST_POSTS = 5;

@Controller('posts')
export class PostsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studio: StudioService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() body: unknown): Promise<CreatePostResponse> {
    const creator = await this.studio.requirePublishingCreator(req);
    const result = validateCreatePost(body);
    if (!result.ok) throw new BadRequestException(result.error);
    const input = result.value;

    return this.prisma.client.$transaction(async (tx) => {
      let minTierId: string | null = null;
      if (input.accessMode === 'subscribers' && input.minTierId) {
        const tier = await tx.subscriptionTier.findFirst({
          where: { id: input.minTierId, creatorId: creator.userId, deletedAt: null, isActive: true },
          select: { id: true },
        });
        if (!tier) throw new BadRequestException('min_tier_not_found');
        minTierId = tier.id;
      }

      const approvedBefore = await tx.post.count({
        where: { creatorId: creator.userId, deletedAt: null, moderationStatus: 'approved' },
      });
      const moderationStatus = approvedBefore < MANUAL_REVIEW_FIRST_POSTS ? 'pending' : 'approved';

      const post = await tx.post.create({
        data: {
          creatorId: creator.userId,
          text: input.text,
          accessMode: input.accessMode,
          minTierId,
          priceMinor: input.accessMode === 'paid' ? input.priceMinor : null,
          currency: input.accessMode === 'paid' ? input.currency : null,
          publishedAt: input.publishAt,
          moderationStatus,
        },
      });

      if (input.mediaIds.length > 0) {
        // Прикрепить можно только своё, ещё не использованное, готовое медиа.
        const attached = await tx.media.updateMany({
          where: {
            id: { in: input.mediaIds },
            ownerId: creator.userId,
            postId: null,
            messageId: null,
            deletedAt: null,
            status: 'ready',
          },
          data: { postId: post.id },
        });
        if (attached.count !== input.mediaIds.length) throw new BadRequestException('media_not_available');
      }

      return { id: post.id, moderationStatus, publishedAt: input.publishAt.toISOString() };
    });
  }
}
