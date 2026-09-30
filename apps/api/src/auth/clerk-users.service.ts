import { createClerkClient } from '@clerk/backend';
import { Prisma } from '@gulf/db';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { authProviderOf, verifyClerkSessionToken } from './clerk-token';

/** Вход через Clerk: проверка токена и связь с таблицей users по clerk_user_id. */
@Injectable()
export class ClerkUsersService {
  private readonly secretKey = process.env.CLERK_SECRET_KEY || undefined;
  private readonly authorizedParties = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',');
  private readonly clerk = this.secretKey ? createClerkClient({ secretKey: this.secretKey }) : null;

  constructor(private readonly prisma: PrismaService) {}

  /** id пользователя в нашей БД по токену Clerk; при первом входе создаёт его с ролью fan. */
  async resolveUserId(token: string): Promise<string | null> {
    const clerkUserId = await verifyClerkSessionToken(token, { secretKey: this.secretKey, authorizedParties: this.authorizedParties });
    if (!clerkUserId) return null;
    const user = await this.findUser(clerkUserId);
    if (user) return user.deletedAt ? null : user.id;
    return this.createUser(clerkUserId);
  }

  private findUser(clerkUserId: string) {
    return this.prisma.client.user.findUnique({ where: { clerkUserId }, select: { id: true, deletedAt: true } });
  }

  private async createUser(clerkUserId: string): Promise<string | null> {
    if (!this.clerk) return null;
    const cu = await this.clerk.users.getUser(clerkUserId);
    const data = {
      clerkUserId,
      phone: cu.primaryPhoneNumber?.phoneNumber ?? null,
      email: cu.primaryEmailAddress?.emailAddress ?? null,
      authProvider: authProviderOf(cu.externalAccounts.map((a) => a.provider)),
    };
    try {
      return (await this.prisma.client.user.create({ data, select: { id: true } })).id;
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') throw e;
      // Параллельный запрос уже создал пользователя — или телефон/почта заняты другим аккаунтом.
      const existing = await this.findUser(clerkUserId);
      if (existing) return existing.deletedAt ? null : existing.id;
      return (await this.prisma.client.user.create({ data: { ...data, phone: null, email: null }, select: { id: true } })).id;
    }
  }
}
