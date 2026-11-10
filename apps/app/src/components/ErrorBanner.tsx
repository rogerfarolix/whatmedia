import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  message: string;
  serverOffer?: string;
  onTryServer?: () => void;
  onClose: () => void;
}

export const ErrorBanner: React.FC<Props> = ({ message, serverOffer, onTryServer, onClose }) => {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex flex-col gap-2 p-4 rounded-xl bg-[var(--wm-warn-light)] border border-[var(--wm-warn)] text-sm text-[var(--wm-ink)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <strong className="block font-semibold">{t('errorTitle')}</strong>
          <span>{message}</span>
          {serverOffer && <span className="block mt-1 text-[var(--wm-muted)]">{serverOffer}</span>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="min-w-11 min-h-11 -mr-2 -mt-2 flex items-center justify-center rounded-md text-[var(--wm-muted)] hover:text-[var(--wm-ink)] focus-visible:outline-2 focus-visible:outline-[var(--wm-focus)]"
        >
          <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {onTryServer && (
        <button
          type="button"
          onClick={onTryServer}
          className="self-start min-h-11 px-4 rounded-[var(--wm-radius-button)] font-semibold text-xs border border-[var(--wm-ink)] hover:bg-[var(--wm-surface)] transition-colors"
        >
          {t('tryServer')}
        </button>
      )}
    </div>
  );
};
