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
