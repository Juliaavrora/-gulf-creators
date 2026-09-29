import { Controller, ForbiddenException, Get, NotFoundException, Param, Query, Req, Res, StreamableFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AccessService } from '../access/access.service';
import { visiblePostWhere } from '../creators/creators.service';
import { PrismaService } from '../prisma/prisma.service';
import { ViewerService } from '../viewer/viewer.service';
import { MediaStorageService, previewKey } from './media-storage.service';
import { MediaUrlSignerService } from './media-url.signer';

@Controller('media')
export class MediaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
    private readonly access: AccessService,
    private readonly viewer: ViewerService,
    private readonly signer: MediaUrlSignerService,
  ) {}

  /** Аватар и обложка автора — публичные. */
  @Get('profile/:handle/:kind')
  async profileImage(@Param('handle') handle: string, @Param('kind') kind: string, @Res({ passthrough: true }) res: Response) {
    if (kind !== 'avatar' && kind !== 'cover') throw new NotFoundException();
    const creator = await this.prisma.client.creatorProfile.findFirst({
      where: { handle, deletedAt: null, status: 'approved' },
      select: { avatarUrl: true, coverUrl: true },
    });
    const key = kind === 'avatar' ? creator?.avatarUrl : creator?.coverUrl;
    return this.send(res, key, 'public, max-age=300');
  }

  /** Размытое превью — публичное, пока пост виден. */
  @Get(':id/preview')
  async preview(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const media = await this.findPostMedia(id);
    return this.send(res, media?.storageKey ? previewKey(media.storageKey) : null, 'public, max-age=300');
  }

  /**
   * Оригинал. Либо по подписанной ссылке (её выдаёт API только при доступе, живёт 5 минут) —
   * так работает <img> в браузере; либо с проверкой access_grants зрителя.
   */
  @Get(':id')
  async original(
    @Param('id') id: string,
    @Query('exp') exp: string | undefined,
    @Query('sig') sig: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const media = await this.findPostMedia(id);
    if (!media?.post) throw new NotFoundException();
    if (this.signer.verify(media.id, exp, sig)) return this.send(res, media.storageKey, 'private, max-age=300');
    const { post } = media;
    const viewerId = await this.viewer.resolveViewerId(req);
    const unlocked = await this.access.unlockedPostIds(viewerId, [
      { id: post.id, creatorId: post.creatorId, accessMode: post.accessMode, minTierLevel: post.minTier?.level ?? null },
    ]);
    if (!unlocked.has(post.id)) throw new ForbiddenException();
    return this.send(res, media.storageKey, 'private, no-store');
  }

  private async findPostMedia(id: string) {
    if (!/^[0-9a-f-]{36}$/.test(id)) return null;
    const media = await this.prisma.client.media.findFirst({
      where: { id, deletedAt: null, status: 'ready', postId: { not: null } },
      include: { post: { include: { minTier: { select: { level: true } } } } },
    });
    if (!media?.post) return null;
    const visible = await this.prisma.client.post.count({ where: { id: media.post.id, ...visiblePostWhere(media.post.creatorId) } });
    return visible ? media : null;
  }

  private async send(res: Response, key: string | null | undefined, cacheControl: string) {
    const stream = key ? await this.storage.open(key) : null;
    if (!stream) throw new NotFoundException();
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': cacheControl });
    return new StreamableFile(stream);
  }
}
