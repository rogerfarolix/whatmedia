import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  isOpen: boolean;
  /** Already-translated sentence explaining why the server is proposed */
  reason?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Explicit, per-file consent before anything leaves the device (PRD US-04).
 * Uses the native <dialog> for focus trapping, Escape handling and inert background.
 */
export const ConsentModal: React.FC<Props> = ({ isOpen, reason, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="w-[calc(100%-2rem)] max-w-md p-0 m-auto rounded-[var(--wm-radius-card)] border border-[var(--wm-border)] bg-[var(--wm-surface)] text-[var(--wm-ink)] shadow-xl backdrop:bg-black/60"
    >
      <div className="p-6 flex flex-col gap-4">
        <h2 id="consent-title" className="text-lg font-bold font-heading">
          {t('consentTitle')}
        </h2>

        {reason && <p className="text-sm m-0">{reason}</p>}

        <p id="consent-body" className="text-xs text-[var(--wm-muted)] leading-relaxed m-0">
          {t('consentBody')}
        </p>

        <ul className="p-3 bg-[var(--wm-paper)] border border-[var(--wm-border)] rounded-lg text-xs flex flex-col gap-1.5 list-disc pl-7 m-0">
          <li>{t('consentPoint1')}</li>
          <li>{t('consentPoint2')}</li>
          <li>{t('consentPoint3')}</li>
        </ul>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            autoFocus
            className="flex-1 min-h-11 rounded-[var(--wm-radius-button)] text-sm font-semibold text-[var(--wm-ink)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-11 rounded-[var(--wm-radius-button)] text-sm font-semibold bg-[var(--wm-signal)] text-[var(--wm-on-signal)] hover:bg-[var(--wm-signal-hover)] transition-all shadow-sm"
          >
            {t('consentAccept')}
          </button>
        </div>
      </div>
    </dialog>
  );
};
