import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useMediaStore } from '../store/useMediaStore';
import { useInstallPlatform } from '../utils/installPrompt';

export const Header: React.FC = () => {
  const { language, toggleLanguage, t } = useTranslation();
  const platform = useInstallPlatform();
  const setInstallSheetOpen = useMediaStore((s) => s.setInstallSheetOpen);

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
          <svg viewBox="0 0 64 64" className="w-8 h-8" aria-hidden="true" focusable="false">
            <rect width="64" height="64" rx="14" fill="#FF5A1F" />
            <path
              d="M18 26V18H26M46 26V18H38M18 38V46H26M46 38V46H38"
              stroke="#0B0F1A"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="32" cy="32" r="3.5" fill="#0B0F1A" />
          </svg>
          <span className="font-semibold text-lg text-[var(--wm-ink)] tracking-tight">WhatMedia</span>
        </a>

        <div className="flex items-center gap-2">
        {platform !== 'installed' && (
          <button
            type="button"
            onClick={() => setInstallSheetOpen(true)}
            className="min-h-11 px-3.5 inline-flex items-center gap-1.5 rounded-full text-sm font-semibold bg-[var(--wm-ink)] text-[var(--wm-paper)]"
          >
            <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
            </svg>
            {t('installButton')}
          </button>
        )}
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t('switchLanguage')}
          lang={language === 'fr' ? 'en' : 'fr'}
          className="min-w-11 min-h-11 px-2.5 text-xs font-semibold rounded-full border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] text-[var(--wm-ink)] transition-colors"
        >
          {language === 'fr' ? 'EN' : 'FR'}
        </button>
        </div>
      </div>
    </header>
  );
};
