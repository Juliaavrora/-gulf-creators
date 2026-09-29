import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ViewerService } from './viewer.service';

/** Доступ к инструментам автора: вход обязателен, профиль одобрен, KYC пройден (SPEC: без KYC нельзя публиковать). */
@Injectable()
export class StudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly viewer: ViewerService,
  ) {}

  async requirePublishingCreator(req: Request) {
    const viewerId = await this.viewer.resolveViewerId(req);
    if (!viewerId) throw new UnauthorizedException();
    const creator = await this.prisma.client.creatorProfile.findFirst({ where: { userId: viewerId, deletedAt: null } });
    if (!creator || creator.status !== 'approved' || creator.kycStatus !== 'approved') {
      throw new ForbiddenException('creator_not_allowed_to_publish');
    }
    return creator;
  }
}
