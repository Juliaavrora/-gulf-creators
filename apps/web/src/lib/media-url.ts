export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Абсолютный адрес файла из API для <img> в браузере. */
export function mediaUrl(path: string): string {
  return `${PUBLIC_API_URL}${path}`;
}
