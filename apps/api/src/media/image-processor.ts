import sharp from 'sharp';

/** SPEC: фото до 20 МБ. */
export const PHOTO_MAX_BYTES = 20 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export interface ProcessedPhoto {
  full: Buffer;
  preview: Buffer;
}

/**
 * Готовит фото к хранению: снимает EXIF (в том числе геолокацию), поворачивает по ориентации,
 * ужимает до 1920 px и делает размытое превью для закрытых постов — на сервере, а не CSS-фильтром (SPEC).
 */
export async function processPhoto(input: Buffer): Promise<ProcessedPhoto> {
  const base = sharp(input, { limitInputPixels: 50_000_000, failOn: 'error' }).rotate();
  const full = await base.clone().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const preview = await sharp(full)
    .resize({ width: 32, height: 40, fit: 'cover' })
    .blur(2)
    .resize({ width: 480, height: 600, fit: 'cover', kernel: 'cubic' })
    .modulate({ brightness: 0.9 })
    .jpeg({ quality: 70 })
    .toBuffer();
  return { full, preview };
}
