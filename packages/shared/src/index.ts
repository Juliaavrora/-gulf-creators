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

/**
 * Ввод цены человеком → минорные единицы (Int). Принимает арабские цифры (٠-٩) и десятичный разделитель «٫».
 * «25» → 2500, «25.5» → 2550, «25.55» → 2555; больше двух знаков после запятой или мусор → null.
 */
export function parseMajorToMinor(input: string): number | null {
  const normalized = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[٫,]/g, '.');
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  const whole = Number(match[1]);
  const frac = Number((match[2] ?? '').padEnd(2, '0'));
  return whole * 100 + frac;
}
