import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t border-[var(--wm-border)] bg-[var(--wm-surface)] py-6 mt-auto">
      <div className="max-w-xl mx-auto px-4 flex flex-col items-center gap-3 text-center text-xs text-[var(--wm-muted)]">
        <div className="flex items-center gap-4">
          <a
            href="https://whatmedia.nealix.org"
            className="hover:text-[var(--wm-ink)] transition-colors"
          >
            Site
          </a>
          <span>·</span>
          <a
            href="https://github.com/rogerfarolix/whatmedia"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--wm-ink)] transition-colors"
          >
            GitHub
          </a>
          <span>·</span>
          <a
            href="/confidentialite"
            className="hover:text-[var(--wm-ink)] transition-colors"
          >
            Confidentialité
          </a>
        </div>

        <p className="text-[11px] max-w-sm leading-relaxed">
          {t('disclaimer')}
        </p>

        <span className="text-[10px] text-[var(--wm-muted)]/60">
          Un projet Nealix par Roger Gnanih · MIT License
        </span>
      </div>
    </footer>
  );
};
