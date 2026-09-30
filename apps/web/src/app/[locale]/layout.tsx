import { ClerkProvider } from '@clerk/nextjs';
import { arSA, enUS } from '@clerk/localizations';
import { RTL_LOCALES, type Locale } from '@gulf/shared';
import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { CLERK_ENABLED, clerkAppearance } from '@/lib/clerk';
import { themeInitScript } from '@/lib/theme';
import '@fontsource-variable/rubik';
import '@fontsource/bricolage-grotesque/800.css';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Home' });
  return { title: t('title') };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const dir = RTL_LOCALES.includes(locale as Locale) ? 'rtl' : 'ltr';
  const content = <NextIntlClientProvider>{children}</NextIntlClientProvider>;

  return (
    // suppressHydrationWarning: data-theme ставит скрипт до гидрации.
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased">
        {CLERK_ENABLED ? (
          <ClerkProvider
            localization={locale === 'ar' ? arSA : enUS}
            appearance={clerkAppearance}
            signInUrl={getPathname({ href: '/sign-in', locale })}
            signUpUrl={getPathname({ href: '/sign-up', locale })}
            signInFallbackRedirectUrl={getPathname({ href: '/', locale })}
            signUpFallbackRedirectUrl={getPathname({ href: '/', locale })}
            afterSignOutUrl={getPathname({ href: '/', locale })}
          >
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
