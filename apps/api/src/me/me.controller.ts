import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Currency, MeDto } from '@gulf/shared';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ViewerService } from '../viewer/viewer.service';

@Controller('me')
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly viewer: ViewerService,
  ) {}

  @Get()
  async me(@Req() req: Request): Promise<MeDto> {
    const viewerId = await this.viewer.resolveViewerId(req);
    if (!viewerId) throw new UnauthorizedException();
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: viewerId },
      select: {
        role: true,
        creatorProfile: {
          select: {
            handle: true,
            displayName: true,
            status: true,
            kycStatus: true,
            deletedAt: true,
            tiers: { where: { deletedAt: null, isActive: true }, orderBy: { level: 'asc' } },
          },
        },
      },
    });
    const c = user.creatorProfile && !user.creatorProfile.deletedAt ? user.creatorProfile : null;
    return {
      role: user.role,
      creator: c && {
        handle: c.handle,
        displayName: c.displayName,
        canPublish: c.status === 'approved' && c.kycStatus === 'approved',
        tiers: c.tiers.map((t) => ({
          id: t.id,
          level: t.level,
          name: t.name,
          priceMinor: t.priceMinor,
          currency: t.currency as Currency,
          perks: Array.isArray(t.perks) ? t.perks.filter((p): p is string => typeof p === 'string') : [],
        })),
      },
    };
  }
}
