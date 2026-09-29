'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { applyTheme, readStoredTheme, THEMES, type Theme } from '@/lib/theme';

export function ThemeSwitcher() {
  const t = useTranslations('ThemeSwitcher');
  const [theme, setTheme] = useState<Theme>('auto');

  useEffect(() => {
    setTheme(readStoredTheme());
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div role="group" aria-label={t('label')} className="grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1">
      {THEMES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={theme === option}
          onClick={() => choose(option)}
          className={
            theme === option
              ? 'h-10 rounded-xl bg-fg text-sm font-semibold text-bg'
              : 'h-10 rounded-xl text-sm font-semibold text-muted hover:text-fg'
          }
        >
          {t(option)}
        </button>
      ))}
    </div>
  );
}
