import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

export const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center text-center gap-3 pt-2">
      <h1 className="text-[2.15rem] leading-[1.08] sm:text-5xl font-[380] text-[var(--wm-ink)]">
        {t('heroTitle')}
      </h1>
      <p className="text-sm text-[var(--wm-muted)] max-w-sm">
        {t('heroSubtitle')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-medium text-[var(--wm-muted)]">
        <span className="px-2.5 py-1 rounded-full bg-[var(--wm-surface)] border border-[var(--wm-border)]">
          <span aria-hidden="true">✨</span> {t('pill1')}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-[var(--wm-surface)] border border-[var(--wm-border)]">
          <span aria-hidden="true">🎁</span> {t('pill2')}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-[var(--wm-surface)] border border-[var(--wm-border)]">
          <span aria-hidden="true">🌱</span> {t('pill3')}
        </span>
      </div>
    </div>
  );
};
