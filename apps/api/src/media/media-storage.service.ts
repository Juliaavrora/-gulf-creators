import { createReadStream, type ReadStream } from 'node:fs';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';

const KEY_PATTERN = /^[a-z0-9][a-z0-9.-]*\.jpg$/;

/** Размытое превью лежит рядом с оригиналом: `<key>.preview.jpg`. */
export function previewKey(key: string): string {
  return key.replace(/\.jpg$/, '.preview.jpg');
}

/**
 * Хранилище медиа. Сейчас — локальная папка для разработки (apps/api/dev-media).
 * В проде его заменит реализация на S3 с подписанными ссылками CloudFront.
 */
@Injectable()
export class MediaStorageService {
  private readonly dir = process.env.DEV_MEDIA_DIR || resolve(__dirname, '../../dev-media');

  async open(key: string): Promise<ReadStream | null> {
    if (!KEY_PATTERN.test(key)) return null;
    const file = join(this.dir, key);
    try {
      await access(file);
    } catch {
      return null;
    }
    return createReadStream(file);
  }

  async save(key: string, data: Buffer): Promise<void> {
    if (!KEY_PATTERN.test(key)) throw new Error(`Invalid media key: ${key}`);
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, key), data);
  }
}
