import { DEFAULT_LOCALE, LOCALES } from '@gulf/shared';
import { defineRouting } from 'next-intl/routing';

// Арабский — локаль по умолчанию и живёт на "/", английский — на "/en".
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
});
