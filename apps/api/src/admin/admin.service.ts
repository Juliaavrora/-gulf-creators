import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ViewerService } from '../viewer/viewer.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly viewer: ViewerService,
  ) {}

  /** Возвращает id админа или бросает 401/403. */
  async requireAdmin(req: Request): Promise<string> {
    const viewerId = await this.viewer.resolveViewerId(req);
    if (!viewerId) throw new UnauthorizedException();
    const user = await this.prisma.client.user.findUnique({ where: { id: viewerId }, select: { role: true, deletedAt: true } });
    if (!user || user.deletedAt || user.role !== 'admin') throw new ForbiddenException();
    return viewerId;
  }
}
