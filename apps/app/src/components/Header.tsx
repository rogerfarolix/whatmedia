import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

export const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useTranslation();

  return (
    <header className="w-full border-b border-[var(--wm-border)] bg-[var(--wm-surface)]/80 backdrop-blur sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:bg-[var(--wm-surface)]"
      >
        {t('skipToContent')}
      </a>
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/app/" className="flex items-center gap-2.5 rounded-md">
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-lg bg-[var(--wm-signal)] flex items-center justify-center text-[var(--wm-on-signal)] font-bold text-sm shadow-sm"
          >
            WM
          </span>
          <span className="font-bold font-heading text-lg text-[var(--wm-ink)] tracking-tight">WhatMedia</span>
        </a>

        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t('switchLanguage')}
          lang={language === 'fr' ? 'en' : 'fr'}
          className="min-w-11 min-h-11 px-2.5 text-xs font-semibold rounded-md border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] text-[var(--wm-ink)] transition-colors"
        >
          {language === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>
    </header>
  );
};
