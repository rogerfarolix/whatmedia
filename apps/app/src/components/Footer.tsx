import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

declare const __APP_VERSION__: string;
const version = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';

export const Footer: React.FC = () => {
  const { t, language } = useTranslation();
  const linkClass = 'inline-flex items-center min-h-11 px-1 hover:text-[var(--wm-ink)] underline-offset-2 hover:underline';

  return (
    <footer className="w-full border-t border-[var(--wm-border)] bg-[var(--wm-surface)] py-6 mt-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="max-w-xl mx-auto px-4 flex flex-col items-center gap-2 text-center text-xs text-[var(--wm-muted)]">
        <nav aria-label={t('footerNav')} className="flex flex-wrap items-center justify-center gap-x-3">
          <a href={language === 'fr' ? '/' : '/en/'} className={linkClass}>
            {t('footerSite')}
          </a>
          <a href="https://github.com/rogerfarolix/whatmedia" target="_blank" rel="noopener noreferrer" className={linkClass}>
            GitHub
          </a>
          <a href={t('footerPrivacyHref')} className={linkClass}>
            {t('footerPrivacy')}
          </a>
          <a href={t('footerLegalHref')} className={linkClass}>
            {t('footerLegal')}
          </a>
        </nav>

        <p className="text-[11px] max-w-sm leading-relaxed m-0">{t('disclaimer')}</p>
        <p className="text-[11px] m-0">{t('footerCredit', { version })}</p>
      </div>
    </footer>
  );
};
