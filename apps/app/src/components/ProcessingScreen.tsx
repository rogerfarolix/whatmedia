import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { formatEta } from '../utils/format';
import type { ProcessingLane } from '../store/useMediaStore';

interface Props {
  ratio: number;
  segmentIndex: number;
  segmentCount: number;
  lane: ProcessingLane;
  etaMs?: number;
  onCancel: () => void;
}

export const ProcessingScreen: React.FC<Props> = ({ ratio, segmentIndex, segmentCount, lane, etaMs, onCancel }) => {
  const { t, language } = useTranslation();
  const percentage = Math.round(Math.min(Math.max(ratio, 0), 1) * 100);

  return (
    <section
      aria-labelledby="processing-title"
      className="flex flex-col items-center justify-center p-8 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)] text-center"
    >
      <div
        className="relative w-28 h-28 mb-5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-labelledby="processing-title"
      >
        <svg aria-hidden="true" className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="transparent" stroke="var(--wm-border)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="var(--wm-signal)"
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * percentage) / 100}
            strokeLinecap="round"
            className="motion-safe:transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-mono text-[var(--wm-ink)]">{percentage}%</span>
        </div>
      </div>

      <h2 id="processing-title" className="text-xl font-bold font-heading text-[var(--wm-ink)] mb-1">
        {t('optimizing')}
      </h2>

      <p className="text-sm text-[var(--wm-muted)] mb-1" aria-live="polite">
        {segmentCount > 1 ? t('processingPart', { i: segmentIndex, n: segmentCount }) : t('processingMedia')}
      </p>
      <p className="text-xs text-[var(--wm-muted)] mb-4 min-h-4">
        {etaMs !== undefined ? t('remaining', { time: formatEta(etaMs, language) }) : ' '}
      </p>

      <div
        className={`p-3 rounded-lg text-xs text-[var(--wm-ink)] max-w-sm mb-3 border ${
          lane === 'local'
            ? 'bg-[var(--wm-ok-light)] border-[var(--wm-ok)]'
            : 'bg-[var(--wm-focus-light)] border-[var(--wm-focus)]'
        }`}
      >
        {lane === 'local' ? t('laneLocal') : t('laneServer')}
      </div>
      <p className="text-[11px] text-[var(--wm-muted)] max-w-sm mb-6">{t('keepScreenOn')}</p>

      <button
        type="button"
        onClick={onCancel}
        className="min-h-11 px-6 py-2.5 rounded-[var(--wm-radius-button)] font-medium text-sm text-[var(--wm-ink)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] transition-colors"
      >
        {t('cancel')}
      </button>
    </section>
  );
};
