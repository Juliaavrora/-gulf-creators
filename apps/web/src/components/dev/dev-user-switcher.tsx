'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { DEV_AUTH_ENABLED, DEV_USER_COOKIE, DEV_USERS } from '@/lib/dev-user';

/** Только для разработки: переключатель «войти как». В проде не показывается (NEXT_PUBLIC_DEV_AUTH). */
export function DevUserSwitcher() {
  const t = useTranslations('DevUser');
  const router = useRouter();
  const [current, setCurrent] = useState('');

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )dev_user=([^;]+)/);
    setCurrent(match ? decodeURIComponent(match[1]!) : '');
  }, []);

  if (!DEV_AUTH_ENABLED) return null;

  function choose(user: string) {
    document.cookie = user
      ? `${DEV_USER_COOKIE}=${encodeURIComponent(user)}; path=/; SameSite=Lax`
      : `${DEV_USER_COOKIE}=; path=/; max-age=0`;
    setCurrent(user);
    router.refresh();
  }

  const options = ['', ...DEV_USERS];
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-dashed border-line p-3">
      <h2 className="text-sm font-semibold text-muted">{t('title')}</h2>
      <div role="group" aria-label={t('title')} className="grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1">
        {options.map((user) => (
          <button
            key={user || 'anon'}
            type="button"
            aria-pressed={current === user}
            onClick={() => choose(user)}
            className={
              current === user
                ? 'h-10 rounded-xl bg-fg text-sm font-semibold text-bg'
                : 'h-10 rounded-xl text-sm font-semibold text-muted hover:text-fg'
            }
          >
            {t(user || 'anonymous')}
          </button>
        ))}
      </div>
      <div className="flex gap-4 ps-1 text-sm font-semibold text-accent-fg">
        <Link href="/sara.brews">{t('openCreator')}</Link>
        <Link href="/studio/new">{t('openNewPost')}</Link>
        <Link href="/admin/moderation">{t('openModeration')}</Link>
      </div>
    </section>
  );
}
