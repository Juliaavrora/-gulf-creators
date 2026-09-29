import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';

/** Срок жизни ссылки на оригинал (SPEC: подписанные ссылки на 5 минут). */
export const MEDIA_URL_TTL_SECONDS = 5 * 60;

/**
 * Подписанные ссылки на оригиналы медиа: `/media/<id>?exp=<unix>&sig=<hmac>`.
 * Ссылку выдаёт API только тому, у кого есть доступ по access_grants; сама ссылка живёт 5 минут.
 * В проде так же будут работать подписанные ссылки CloudFront.
 */
export class MediaUrlSigner {
  constructor(private readonly secret: string) {}

  sign(mediaId: string, nowMs = Date.now(), ttlSeconds = MEDIA_URL_TTL_SECONDS): string {
    const exp = Math.floor(nowMs / 1000) + ttlSeconds;
    return `/media/${mediaId}?exp=${exp}&sig=${this.signature(mediaId, exp)}`;
  }

  verify(mediaId: string, exp: string | undefined, sig: string | undefined, nowMs = Date.now()): boolean {
    if (!exp || !sig || !/^\d{1,12}$/.test(exp)) return false;
    if (Number(exp) * 1000 < nowMs) return false;
    const expected = Buffer.from(this.signature(mediaId, Number(exp)));
    const given = Buffer.from(sig);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }

  private signature(mediaId: string, exp: number): string {
    return createHmac('sha256', this.secret).update(`${mediaId}.${exp}`).digest('base64url');
  }
}

/** Секрет из MEDIA_SIGNING_SECRET. В разработке без него — случайный на время жизни процесса. */
export function mediaSigningSecret(): string {
  const secret = process.env.MEDIA_SIGNING_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('MEDIA_SIGNING_SECRET is required in production');
  return randomBytes(32).toString('hex');
}

/** Nest-провайдер с секретом из окружения. */
@Injectable()
export class MediaUrlSignerService extends MediaUrlSigner {
  constructor() {
    super(mediaSigningSecret());
  }
}
