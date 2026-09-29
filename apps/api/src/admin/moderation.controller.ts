import { BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import type { Currency, ModerationItemDto } from '@gulf/shared';
import type { Request } from 'express';
import { MediaUrlSignerService } from '../media/media-url.signer';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import { publishedAtAfterApproval, validateDecision } from './moderation.rules';

@Controller('admin/moderation')
export class ModerationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly admin: AdminService,
    private readonly signer: MediaUrlSignerService,
  ) {}

  /** Очередь: посты, ждущие проверки (pending), и опубликованные с пометкой автопроверки (flagged). Старые — первыми. */
  @Get('queue')
  async queue(@Req() req: Request): Promise<ModerationItemDto[]> {
    await this.admin.requireAdmin(req);
    const posts = await this.prisma.client.post.findMany({
      where: { deletedAt: null, moderationStatus: { in: ['pending', 'flagged'] } },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        creator: { select: { handle: true, displayName: true } },
        media: { where: { deletedAt: null, status: 'ready' }, orderBy: { createdAt: 'asc' } },
      },
    });
    return Promise.all(
      posts.map(async (p) => ({
        postId: p.id,
        reason: p.moderationStatus === 'flagged' ? ('auto_flagged' as const) : ('first_posts' as const),
        creator: { handle: p.creator.handle, displayName: p.creator.displayName },
        creatorPostNumber:
          (await this.prisma.client.post.count({ where: { creatorId: p.creatorId, deletedAt: null, createdAt: { lt: p.createdAt } } })) + 1,
        text: p.text,
        accessMode: p.accessMode,
        priceMinor: p.priceMinor,
        currency: (p.currency as Currency | null) ?? null,
        createdAt: p.createdAt.toISOString(),
        media: p.media.map((m) => ({ id: m.id, kind: m.kind, path: this.signer.sign(m.id) })),
      })),
    );
  }

  /** Решение по посту. Всё логируется в moderation_actions с id админа (SPEC). */
  @Post('posts/:id/decision')
  async decide(@Req() req: Request, @Param('id', new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    const adminId = await this.admin.requireAdmin(req);
    const result = validateDecision(body);
    if (!result.ok) throw new BadRequestException(result.error);
    const { decision, reason } = result.value;

    return this.prisma.client.$transaction(async (tx) => {
      const post = await tx.post.findFirst({ where: { id, deletedAt: null } });
      if (!post) throw new NotFoundException();
      if (post.moderationStatus !== 'pending' && post.moderationStatus !== 'flagged') {
        throw new BadRequestException('already_decided');
      }
      const now = new Date();
      await tx.post.update({
        where: { id },
        data:
          decision === 'approve'
            ? { moderationStatus: 'approved', publishedAt: publishedAtAfterApproval(post.publishedAt, now) }
            : { moderationStatus: 'rejected' },
      });
      await tx.moderationAction.create({
        data: {
          targetType: 'post',
          targetId: id,
          action: decision === 'approve' ? 'approve_post' : 'hide_post',
          reason: reason ?? '',
          adminId,
        },
      });
      return { postId: id, moderationStatus: decision === 'approve' ? 'approved' : 'rejected' };
    });
  }
}
