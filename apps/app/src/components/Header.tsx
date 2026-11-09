import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

export const Header: React.FC = () => {
  const { language, toggleLanguage } = useTranslation();

  return (
    <header className="w-full border-b border-[var(--wm-border)] bg-[var(--wm-surface)]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--wm-signal)] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            WM
          </div>
          <span className="font-bold font-heading text-lg text-[var(--wm-ink)] tracking-tight">
            WhatMedia
          </span>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] text-[var(--wm-ink)] transition-colors"
        >
          {language === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>
    </header>
  );
};
