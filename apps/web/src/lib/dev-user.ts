/**
 * Только для разработки, пока нет входа через Clerk: «войти как» тестовый пользователь.
 * Выбор хранится в cookie, API получает его заголовком x-dev-user (работает только при DEV_AUTH=true в API).
 */
export const DEV_AUTH_ENABLED = process.env.NEXT_PUBLIC_DEV_AUTH === 'true';
export const DEV_USER_COOKIE = 'dev_user';
export const DEV_USERS = ['dev_sara', 'dev_maryam'] as const;

/** Для кода в браузере. */
export function devUserHeaders(): Record<string, string> {
  if (!DEV_AUTH_ENABLED || typeof document === 'undefined') return {};
  const match = document.cookie.match(/(?:^|; )dev_user=([^;]+)/);
  return match ? { 'x-dev-user': decodeURIComponent(match[1]!) } : {};
}
