'use client';

import { Show, UserButton } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { CLERK_ENABLED } from '@/lib/clerk';

/** Шапка: «Войти» для гостя, аватар с меню профиля — после входа через Clerk. */
export function AuthButton() {
  const t = useTranslations('Auth');
  if (!CLERK_ENABLED) return null;

  return (
    <>
      <Show when="signed-out">
        <Link href="/sign-in" className="flex h-11 items-center rounded-2xl bg-brand px-4 text-sm font-bold text-on-brand">
          {t('signIn')}
        </Link>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}
