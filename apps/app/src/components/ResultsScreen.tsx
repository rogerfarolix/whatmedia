import React from 'react';
import type { OutputFile } from '@whatmedia/core';
import { useTranslation } from '../i18n/useTranslation';
import { formatBytes, formatDuration } from '../utils/format';

interface Props {
  outputs: OutputFile[];
  partial?: boolean;
  onReset: () => void;
  onNextInQueue?: () => void;
  nextFileName?: string;
  queueRemainingCount?: number;
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download on Safari: keep the URL alive for a while.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function canShareFile(file: File): boolean {
  try {
    return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}

const Preview: React.FC<{ output: OutputFile }> = ({ output }) => {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    const u = URL.createObjectURL(output.file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [output.file]);

  if (!url) return <div className="w-14 h-20 rounded-md bg-[var(--wm-border)]" />;
  return output.file.type.startsWith('image/') ? (
    <img src={url} alt="" className="w-14 h-20 object-cover rounded-md bg-black shrink-0" />
  ) : (
    // #t=0.1 makes iOS Safari render the first frame as a thumbnail.
    <video
      src={`${url}#t=0.1`}
      preload="metadata"
      muted
      playsInline
      aria-hidden="true"
      className="w-14 h-20 object-cover rounded-md bg-black shrink-0"
    />
  );
};

export const ResultsScreen: React.FC<Props> = ({
  outputs,
  partial = false,
  onReset,
  onNextInQueue,
  nextFileName,
  queueRemainingCount = 0,
}) => {
  const { t, language } = useTranslation();
  const [sharingIndex, setSharingIndex] = React.useState<number | null>(null);
  const [shared, setShared] = React.useState<Set<number>>(new Set());
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const multi = outputs.length > 1;

  React.useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleShare = async (output: OutputFile) => {
    setSharingIndex(output.index);
    try {
      if (canShareFile(output.file)) {
        // Files only: adding text/title makes WhatsApp drop the file on some platforms.
        await navigator.share({ files: [output.file] });
        setShared((prev) => new Set(prev).add(output.index));
      } else {
        downloadFile(output.file);
      }
    } catch {
      // User closed the share sheet
    } finally {
      setSharingIndex(null);
    }
  };

  const handleDownloadAll = async () => {
    for (const output of outputs) {
      downloadFile(output.file);
      // Browsers block bursts of downloads: space them out.
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  const shareSupported = outputs[0] ? canShareFile(outputs[0].file) : false;

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
        <h2 id="results-title" ref={headingRef} tabIndex={-1} className="text-xl font-bold font-heading text-[var(--wm-ink)] outline-none">
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

      <ol className="flex flex-col gap-3 list-none m-0 p-0">
        {outputs.map((out) => {
          const isShared = shared.has(out.index);
          const title = multi ? t('part', { i: out.index, n: out.totalSegments }) : out.file.name;
          return (
            <li
              key={out.index}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--wm-paper)] border border-[var(--wm-border)]"
            >
              <Preview output={out} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-sm text-[var(--wm-ink)] truncate">{title}</span>
                <span className="text-xs text-[var(--wm-muted)]">
                  {out.durationSec > 0 ? `${formatDuration(out.durationSec)} · ` : ''}
                  {formatBytes(out.sizeBytes, language)}
                </span>
                {isShared && <span className="text-xs font-semibold text-[var(--wm-ok)]">✓ {t('shared')}</span>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleShare(out)}
                  disabled={sharingIndex === out.index}
                  aria-label={`${shareSupported ? t('shareToStatus') : t('download')} — ${title}`}
                  className="min-h-11 px-4 rounded-[var(--wm-radius-button)] font-semibold text-xs bg-[var(--wm-signal)] text-[var(--wm-on-signal)] hover:bg-[var(--wm-signal-hover)] transition-all shadow-sm whitespace-nowrap disabled:opacity-60"
                >
                  {sharingIndex === out.index ? t('sharing') : shareSupported ? t('shareToStatus') : t('download')}
                </button>
                {shareSupported && (
                  <button
                    type="button"
                    onClick={() => downloadFile(out.file)}
                    aria-label={`${t('download')} — ${title}`}
                    className="min-h-11 px-4 rounded-[var(--wm-radius-button)] text-xs text-[var(--wm-ink)] border border-[var(--wm-border)] hover:bg-[var(--wm-surface)] whitespace-nowrap"
                  >
                    {t('download')}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {multi && (
        <button
          type="button"
          onClick={handleDownloadAll}
          className="min-h-11 rounded-[var(--wm-radius-button)] font-medium text-xs text-[var(--wm-ink)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] transition-colors text-center"
        >
          {t('saveAllFiles')}
        </button>
      )}

      <div className="p-3 bg-[var(--wm-focus-light)] border border-[var(--wm-focus)] rounded-lg text-xs text-[var(--wm-ink)]">
        <strong>{t('hdTipTitle')}</strong> {t('hdTip')}
        {multi && <> {t('shareOrderTip')}</>}
      </div>

      {onNextInQueue && nextFileName && (
        <button
          type="button"
          onClick={onNextInQueue}
          className="min-h-11 py-3 px-4 rounded-[var(--wm-radius-button)] font-semibold text-sm bg-[var(--wm-signal)] text-[var(--wm-on-signal)] hover:bg-[var(--wm-signal-hover)] transition-all shadow-md text-center"
        >
          {t(queueRemainingCount > 1 ? 'nextInQueuePlural' : 'nextInQueue', {
            n: queueRemainingCount,
            name: nextFileName,
          })}{' '}
          <span aria-hidden="true">→</span>
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
