import { SignIn } from '@clerk/nextjs';
import type { Locale } from '@gulf/shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getPathname, Link } from '@/i18n/navigation';
import { CLERK_ENABLED } from '@/lib/clerk';

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return { title: t('signInTitle') };
}

/** Способы входа (телефон, Google, Apple) включаются в панели Clerk; здесь только готовое окно Clerk. */
export default async function SignInPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!CLERK_ENABLED) notFound();
  const t = await getTranslations('Home');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-8 px-4 py-6">
      <Link href="/" dir="ltr" className="self-start font-brand text-3xl font-extrabold tracking-tight text-accent-fg">
        {t('title')}
      </Link>
      <SignIn path={getPathname({ href: '/sign-in', locale })} />
    </main>
  );
}
