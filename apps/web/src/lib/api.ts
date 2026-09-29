/** Клиент API для серверных компонентов. Клиенты говорят только с API (см. CLAUDE.md). */

const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** GET из API; 404 → null. */
export async function apiGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${SERVER_API_URL}${path}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return (await res.json()) as T;
}

/** Абсолютный адрес файла из API для <img> в браузере. */
export function mediaUrl(path: string): string {
  return `${PUBLIC_API_URL}${path}`;
}
