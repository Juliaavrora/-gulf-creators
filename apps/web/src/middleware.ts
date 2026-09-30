import { clerkMiddleware } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { CLERK_ENABLED } from './lib/clerk';

const intlMiddleware = createMiddleware(routing);

// Clerk только читает сессию (для auth() в серверных компонентах); какие страницы закрыты, решает API.
export default CLERK_ENABLED ? clerkMiddleware((_auth, req) => intlMiddleware(req)) : intlMiddleware;

export const config = {
  // Имена авторов бывают с точкой (sara.brews), поэтому пропускаем только настоящие файлы по расширению.
  matcher: '/((?!api|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|txt|xml|json|webmanifest|woff2?)$).*)',
};
