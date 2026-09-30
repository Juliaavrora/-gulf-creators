/** Вход через Clerk включён, если задан публичный ключ. Без ключей работает только dev-вход (см. dev-user.ts). */
export const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/** Цвета окон Clerk — из токенов globals.css, поэтому сами переключаются между светлой и тёмной темой. */
export const clerkAppearance = {
  variables: {
    colorPrimary: 'var(--color-brand)',
    colorPrimaryForeground: 'var(--color-on-brand)',
    colorBackground: 'var(--color-bg)',
    colorForeground: 'var(--color-fg)',
    colorMutedForeground: 'var(--color-muted)',
    colorNeutral: 'var(--color-fg)',
    colorInput: 'var(--color-surface)',
    colorInputForeground: 'var(--color-fg)',
    fontFamily: 'var(--font-sans)',
  },
};
