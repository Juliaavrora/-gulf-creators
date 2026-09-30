import { verifyToken } from '@clerk/backend';

export interface ClerkTokenOptions {
  /** CLERK_SECRET_KEY: по нему Clerk SDK скачивает публичные ключи (JWKS) и кэширует их. */
  secretKey?: string;
  /** PEM публичного ключа — проверка без сети (в тестах). */
  jwtKey?: string;
  /** Адреса сайта, с которых разрешён вход (claim azp). */
  authorizedParties?: string[];
}

/** Токен из заголовка `Authorization: Bearer <token>`. */
export function bearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1]! : null;
}

/**
 * Проверяет сессионный JWT Clerk: подпись, срок действия, azp. Возвращает clerk_user_id (claim sub)
 * или null, если токен не прошёл проверку. Роли из токена не берём — только из нашей БД.
 */
export async function verifyClerkSessionToken(token: string, options: ClerkTokenOptions): Promise<string | null> {
  if (!options.secretKey && !options.jwtKey) return null;
  try {
    // Clerk SDK возвращает payload и бросает исключение при ошибке, хотя типы описывают { data, errors }.
    const result = (await verifyToken(token, options)) as { sub?: unknown; data?: { sub?: unknown }; errors?: unknown };
    if (result.errors) return null;
    const sub = result.data ? result.data.sub : result.sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

/** Как пользователь вошёл: соцсеть из внешних аккаунтов Clerk, иначе — телефон. */
export function authProviderOf(externalProviders: string[]): 'google' | 'apple' | 'phone' {
  if (externalProviders.some((p) => p.endsWith('google'))) return 'google';
  if (externalProviders.some((p) => p.endsWith('apple'))) return 'apple';
  return 'phone';
}
