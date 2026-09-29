export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';
export const RTL_LOCALES: readonly Locale[] = ['ar'];

export const CURRENCIES = ['USD', 'AED', 'SAR'] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * Денежная сумма: целое число в минорных единицах валюты (центы, филсы, халалы).
 * Никаких float — см. CLAUDE.md.
 */
export interface Money {
  amountMinor: number;
  currency: Currency;
}
export * from './api';

/**
 * Сумма для показа. Хранение и расчёты — только в минорных единицах (Int); деление здесь — только для отображения.
 * Цифры всегда латинские: так привычнее в приложениях Залива и совпадает с макетами.
 */
export function formatMoney(amountMinor: number, currency: Currency, locale: Locale): string {
  const whole = amountMinor % 100 === 0;
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-AE-u-nu-latn' : 'en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(amountMinor / 100);
}
