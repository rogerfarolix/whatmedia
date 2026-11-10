import React from 'react';
import { useTranslation, type TranslationKey } from '../i18n/useTranslation';
import type { BatchItem } from '../store/useMediaStore';
import { OutputRow } from './OutputRow';
import { ShareAllBar } from './ShareAllBar';

interface Props {
  items: BatchItem[];
  stopped: boolean;
  onRetryAlone: (item: BatchItem) => void;
  onReset: () => void;
}

export const BatchResultsScreen: React.FC<Props> = ({ items, stopped, onRetryAlone, onReset }) => {
  const { t } = useTranslation();
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const [shared, setShared] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const done = items.filter((i) => i.status === 'done');
  const failed = items.filter((i) => i.status === 'error' || i.status === 'skipped');
  const allOutputs = done.flatMap((i) => i.outputs);
  const key = (item: BatchItem, index: number) => `${item.id}:${index}`;
  const mark = (k: string) => setShared((prev) => new Set(prev).add(k));

  return (
    <section
      aria-labelledby="batch-results-title"
      className="flex flex-col gap-5 p-5 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)]"
    >
      <div className="text-center">
        <h2 id="batch-results-title" ref={headingRef} tabIndex={-1} className="text-xl font-bold font-heading text-[var(--wm-ink)] outline-none">
          {done.length > 0 ? t('readyToPost') : t('errorTitle')}
        </h2>
        <p className="text-xs text-[var(--wm-muted)] mt-1 m-0">
          {t('batchDone', { ok: done.length, n: items.length, files: allOutputs.length })}
        </p>
      </div>

      {stopped && (
        <p role="status" className="text-xs p-3 rounded-lg bg-[var(--wm-warn-light)] border border-[var(--wm-warn)] text-[var(--wm-ink)] m-0">
          {t('batchStopped')}
        </p>
      )}

      <ShareAllBar
        outputs={allOutputs}
        onSharedAll={() => setShared(new Set(done.flatMap((i) => i.outputs.map((o) => key(i, o.index)))))}
      />

      {done.map((item) => (
        <div key={item.id} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--wm-ink)] truncate m-0">{item.file.name}</h3>
          <ol className="flex flex-col gap-2 list-none m-0 p-0">
            {item.outputs.map((out) => (
              <OutputRow
                key={out.index}
                output={out}
                title={item.outputs.length > 1 ? t('part', { i: out.index, n: out.totalSegments }) : out.file.name}
                shared={shared.has(key(item, out.index))}
                onShared={() => mark(key(item, out.index))}
              />
            ))}
          </ol>
        </div>
      ))}

      {failed.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--wm-ink)] m-0">{t('batchFailedTitle', { n: failed.length })}</h3>
          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {failed.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--wm-warn-light)] border border-[var(--wm-warn)]">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-[var(--wm-ink)] truncate">{item.file.name}</span>
                  <span className="text-xs text-[var(--wm-ink)]">
                    {item.status === 'skipped' ? t('batchSkipped') : t((item.errorKey as TranslationKey) ?? 'errorGeneric')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onRetryAlone(item)}
                  className="min-h-11 px-3 shrink-0 rounded-[var(--wm-radius-button)] text-xs font-semibold border border-[var(--wm-ink)] text-[var(--wm-ink)] hover:bg-[var(--wm-surface)]"
                >
                  {t('batchRetryAlone')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allOutputs.length > 0 && (
        <div className="p-3 bg-[var(--wm-focus-light)] border border-[var(--wm-focus)] rounded-lg text-xs text-[var(--wm-ink)]">
          <strong>{t('hdTipTitle')}</strong> {t('hdTip')}
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="min-h-11 py-2 font-medium text-xs text-[var(--wm-muted)] hover:text-[var(--wm-ink)] text-center"
      >
        {t('optimizeAnother')}
      </button>
    </section>
  );
};
