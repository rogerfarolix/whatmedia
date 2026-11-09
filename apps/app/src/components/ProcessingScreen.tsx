import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  ratio: number;
  segmentIndex: number;
  segmentCount: number;
  onCancel: () => void;
}

export const ProcessingScreen: React.FC<Props> = ({
  ratio,
  segmentIndex,
  segmentCount,
  onCancel,
}) => {
  const { t } = useTranslation();
  const percentage = Math.round(ratio * 100);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)] text-center">
      {/* Animated Circular Ring */}
      <div className="relative w-28 h-28 mb-5">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="var(--wm-border)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="var(--wm-signal)"
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * Math.min(Math.max(percentage, 0), 100)) / 100}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-mono text-[var(--wm-ink)]">
            {percentage}%
          </span>
        </div>
      </div>

      <h2 className="text-xl font-bold font-heading text-[var(--wm-ink)] mb-1">
        {t('optimizing')}
      </h2>

      <p className="text-sm text-[var(--wm-muted)] mb-3">
        {segmentCount > 1
          ? `${t('processingPart')} ${segmentIndex} / ${segmentCount}`
          : t('processingMedia')}
      </p>

      <div className="p-3 bg-[var(--wm-ok-light)] border border-[var(--wm-ok)] rounded-lg text-xs text-[var(--wm-ink)] max-w-sm mb-6">
        🔒 {t('localProcessingNotice')}
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2.5 rounded-[var(--wm-radius-button)] font-medium text-sm text-[var(--wm-muted)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] transition-colors"
      >
        {t('cancel')}
      </button>
    </div>
  );
};

