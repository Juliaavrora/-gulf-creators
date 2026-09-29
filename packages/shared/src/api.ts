import type { Currency } from './index';

/** Ответы API, общие для apps/api и apps/web. Все суммы — в минорных единицах. */

export type AccessMode = 'free' | 'subscribers' | 'paid';
export type MediaKind = 'photo' | 'video';

export interface TierDto {
  id: string;
  level: number;
  name: string;
  priceMinor: number;
  currency: Currency;
  perks: string[];
}

export interface CreatorProfileDto {
  handle: string;
  displayName: string;
  bio: string | null;
  /** Пути относительно API, например `/media/profile/sara.brews/avatar`. */
  avatarPath: string | null;
  coverPath: string | null;
  stats: { posts: number; videos: number };
  tiers: TierDto[];
}

export interface PostMediaDto {
  id: string;
  kind: MediaKind;
  /** Длительность видео в секундах. */
  duration: number | null;
  /** Размытое превью — доступно всем. */
  previewPath: string;
  /** Оригинал — только если у зрителя есть доступ, иначе null. */
  path: string | null;
}

export interface PostDto {
  id: string;
  accessMode: AccessMode;
  /** Минимальный уровень тарифа для access_mode = subscribers. */
  minTierLevel: number | null;
  priceMinor: number | null;
  currency: Currency | null;
  publishedAt: string;
  locked: boolean;
  /** Текст закрытого поста не отдаётся. */
  text: string | null;
  media: PostMediaDto[];
}

export type PostFilter = 'all' | 'video' | 'paid';

export interface MeDto {
  role: 'fan' | 'creator' | 'admin';
  creator: {
    handle: string;
    displayName: string;
    /** Можно ли публиковать: профиль одобрен и KYC пройден. */
    canPublish: boolean;
    tiers: TierDto[];
  } | null;
}

export interface UploadedMediaDto {
  id: string;
  kind: MediaKind;
  previewPath: string;
}

export interface CreatePostRequest {
  text?: string;
  accessMode: AccessMode;
  /** Только для subscribers; null/отсутствует — любой тариф автора. */
  minTierId?: string | null;
  /** Только для paid. */
  priceMinor?: number;
  currency?: Currency;
  mediaIds: string[];
  /** ISO-дата отложенной публикации; нет — сразу. */
  publishAt?: string;
}

export interface CreatePostResponse {
  id: string;
  /** pending — пост ждёт ручной проверки (первые 5 постов автора). */
  moderationStatus: 'pending' | 'approved';
  publishedAt: string;
}
