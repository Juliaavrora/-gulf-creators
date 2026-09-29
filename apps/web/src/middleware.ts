import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Имена авторов бывают с точкой (sara.brews), поэтому пропускаем только настоящие файлы по расширению.
  matcher: '/((?!api|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|txt|xml|json|webmanifest|woff2?)$).*)',
};
