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
