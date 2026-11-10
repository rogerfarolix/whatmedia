import React from 'react';
import type { OutputFile } from '@whatmedia/core';
import { useTranslation } from '../i18n/useTranslation';
import { OutputRow } from './OutputRow';
import { ShareAllBar } from './ShareAllBar';

interface Props {
  outputs: OutputFile[];
  partial?: boolean;
  onReset: () => void;
  /** Shown when this file was retried from a multi-file selection */
  onBackToBatch?: () => void;
}

export const ResultsScreen: React.FC<Props> = ({ outputs, partial = false, onReset, onBackToBatch }) => {
  const { t } = useTranslation();
  const [shared, setShared] = React.useState<Set<number>>(new Set());
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const multi = outputs.length > 1;

  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const markShared = (index: number) => setShared((prev) => new Set(prev).add(index));

  return (
    <section
      aria-labelledby="results-title"
      className="flex flex-col gap-5 p-5 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)]"
    >
      <div className="text-center">
        <span aria-hidden="true" className="inline-block p-2 rounded-full bg-[var(--wm-ok-light)] text-[var(--wm-ok)] mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 id="results-title" ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-[var(--wm-ink)] outline-none">
          {t('readyToPost')}
        </h2>
        <p className="text-xs text-[var(--wm-muted)] mt-1">
          {multi ? t('partsGenerated', { n: outputs.length }) : t('onePartGenerated')}
        </p>
      </div>

      {partial && (
        <p role="status" className="text-xs p-3 rounded-lg bg-[var(--wm-warn-light)] border border-[var(--wm-warn)] text-[var(--wm-ink)] m-0">
          {t('partialResults')}
        </p>
      )}

      <ShareAllBar outputs={outputs} onSharedAll={() => setShared(new Set(outputs.map((o) => o.index)))} />

      <ol className="flex flex-col gap-3 list-none m-0 p-0">
        {outputs.map((out) => (
          <OutputRow
            key={out.index}
            output={out}
            title={multi ? t('part', { i: out.index, n: out.totalSegments }) : out.file.name}
            shared={shared.has(out.index)}
            onShared={() => markShared(out.index)}
          />
        ))}
      </ol>

      <div className="p-3 bg-[var(--wm-focus-light)] border border-[var(--wm-focus)] rounded-lg text-xs text-[var(--wm-ink)]">
        <strong>{t('hdTipTitle')}</strong> {t('hdTip')}
        {multi && <> {t('shareOrderTip')}</>}
      </div>

      {onBackToBatch && (
        <button
          type="button"
          onClick={onBackToBatch}
          className="min-h-11 py-3 px-4 rounded-[var(--wm-radius-button)] font-semibold text-sm border border-[var(--wm-ink)] text-[var(--wm-ink)] hover:bg-[var(--wm-paper)]"
        >
          {t('backToBatch')}
        </button>
      )}

      <button
        type="button"
        onClick={onReset}
        className="min-h-11 py-2 font-medium text-xs text-[var(--wm-muted)] hover:text-[var(--wm-ink)] transition-colors text-center"
      >
        {t('optimizeAnother')}
      </button>
    </section>
  );
};
