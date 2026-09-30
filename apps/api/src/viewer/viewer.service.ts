import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { bearerToken } from '../auth/clerk-token';
import { ClerkUsersService } from '../auth/clerk-users.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Кто смотрит. Основной способ — токен Clerk в `Authorization: Bearer <token>`.
 * Для разработки и демо-стенда зрителя можно задать заголовком `x-dev-user: <clerk_user_id>` —
 * только при DEV_AUTH=true. В проде DEV_AUTH запрещён (см. main.ts).
 */
@Injectable()
export class ViewerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clerkUsers: ClerkUsersService,
  ) {}

  async resolveViewerId(req: Request): Promise<string | null> {
    const token = bearerToken(req.headers.authorization);
    const clerkViewer = token ? await this.clerkUsers.resolveUserId(token) : null;
    if (clerkViewer) return clerkViewer;

    if (process.env.DEV_AUTH !== 'true') return null;
    const header = req.headers['x-dev-user'];
    if (typeof header !== 'string' || header.length === 0) return null;
    const user = await this.prisma.client.user.findUnique({
      where: { clerkUserId: header },
      select: { id: true, deletedAt: true },
    });
    return user && !user.deletedAt ? user.id : null;
  }
}
