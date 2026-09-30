import { getToken } from '@clerk/nextjs';
import { CLERK_ENABLED } from './clerk';
import { devUserHeaders } from './dev-user';

/** Заголовки для запросов к API из браузера: токен Clerk и (на демо-стенде) x-dev-user. */
export async function apiHeaders(): Promise<Record<string, string>> {
  const headers = devUserHeaders();
  if (CLERK_ENABLED) {
    const token = await getToken().catch(() => null);
    if (token) headers.authorization = `Bearer ${token}`;
  }
  return headers;
}
