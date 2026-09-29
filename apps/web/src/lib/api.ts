import { cookies } from 'next/headers';
import { DEV_AUTH_ENABLED, DEV_USER_COOKIE } from './dev-user';

/** Клиент API для серверных компонентов. Клиенты говорят только с API (см. CLAUDE.md). */

const SERVER_API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function viewerHeaders(): Promise<Record<string, string>> {
  if (!DEV_AUTH_ENABLED) return {};
  const devUser = (await cookies()).get(DEV_USER_COOKIE)?.value;
  return devUser ? { 'x-dev-user': devUser } : {};
}

/** GET из API; 404 и 401 → null. */
export async function apiGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${SERVER_API_URL}${path}`, { cache: 'no-store', headers: await viewerHeaders() });
  if (res.status === 404 || res.status === 401) return null;
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export { mediaUrl } from './media-url';
