import { FocusReticleIcon } from './icons/Icons';
import { useTranslation } from '../i18n/useTranslation';

export function Header() {
  const { t, lang, toggleLanguage } = useTranslation();

  return (
    <header className="w-full border-b border-wm-border/40 bg-wm-paper/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/app/"
          className="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus focus-visible:ring-offset-2 focus-visible:ring-offset-wm-paper py-1"
          aria-label={t.accessibility.logoAria}
        >
          <div className="w-9 h-9 rounded-xl bg-wm-ink flex items-center justify-center text-wm-signal shadow-sm group-hover:scale-105 transition-transform">
            <FocusReticleIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-lg leading-tight tracking-tight text-wm-ink">
              WhatMedia
            </span>
          </div>
        </a>

        {/* Language switch button */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-full border border-wm-border bg-wm-surface text-sm font-semibold text-wm-ink hover:border-wm-signal hover:text-wm-signal active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus focus-visible:ring-offset-2 focus-visible:ring-offset-wm-paper flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          aria-label={t.header.switchLanguage}
        >
          <span className="text-xs uppercase tracking-wider text-wm-muted">Lang:</span>
          <span className="font-bold">{lang.toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
}
