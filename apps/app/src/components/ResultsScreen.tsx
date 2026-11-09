import React from 'react';
import type { OutputFile } from '@whatmedia/core';
import { useTranslation } from '../i18n/useTranslation';
import { formatBytes, formatDuration } from '../utils/format';

interface Props {
  outputs: OutputFile[];
  onReset: () => void;
}

export const ResultsScreen: React.FC<Props> = ({ outputs, onReset }) => {
  const { t } = useTranslation();
  const [sharingIndex, setSharingIndex] = React.useState<number | null>(null);

  const handleShare = async (output: OutputFile) => {
    setSharingIndex(output.index);
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.canShare?.({ files: [output.file] })) {
        await navigator.share({
          files: [output.file],
          title: output.file.name,
        });
      } else {
        // Fallback download
        const url = URL.createObjectURL(output.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = output.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      // Ignore user aborts
    } finally {
      setSharingIndex(null);
    }
  };

  const handleDownloadAll = () => {
    for (const output of outputs) {
      const url = URL.createObjectURL(output.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = output.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)]">
      <div className="text-center">
        <span className="inline-block p-2 rounded-full bg-[var(--wm-ok-light)] text-[var(--wm-ok)] mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 className="text-xl font-bold font-heading text-[var(--wm-ink)]">
          {t('readyToPost')}
        </h2>
        <p className="text-xs text-[var(--wm-muted)] mt-1">
          {outputs.length > 1
            ? `${outputs.length} ${t('partsGenerated')}`
            : t('onePartGenerated')}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {outputs.map((out) => (
          <div
            key={out.index}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--wm-paper)] border border-[var(--wm-border)]"
          >
            <div className="flex flex-col min-w-0 pr-2">
              <span className="font-semibold text-sm text-[var(--wm-ink)] truncate">
                {outputs.length > 1 ? `${t('part')} ${out.index} / ${out.totalSegments}` : out.file.name}
              </span>
              <span className="text-xs text-[var(--wm-muted)]">
                {formatDuration(out.durationSec)} · {formatBytes(out.sizeBytes)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleShare(out)}
              disabled={sharingIndex === out.index}
              className="px-4 py-2 rounded-[var(--wm-radius-button)] font-semibold text-xs bg-[var(--wm-signal)] text-white hover:bg-[var(--wm-signal-hover)] transition-all shadow-sm active:scale-98 whitespace-nowrap"
            >
              {sharingIndex === out.index ? t('sharing') : t('shareToStatus')}
            </button>
          </div>
        ))}
      </div>

      {outputs.length > 1 && (
        <button
          type="button"
          onClick={handleDownloadAll}
          className="py-2.5 rounded-[var(--wm-radius-button)] font-medium text-xs text-[var(--wm-muted)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] transition-colors text-center"
        >
          {t('saveAllFiles')}
        </button>
      )}

      <div className="p-3 bg-[var(--wm-focus-light)] border border-[var(--wm-focus)] rounded-lg text-xs text-[var(--wm-ink)]">
        💡 <strong>Conseil WhatsApp :</strong> Lors de la publication du statut, active l'option <strong>HD</strong> en haut pour garantir la qualité maximale.
      </div>

      <button
        type="button"
        onClick={onReset}
        className="py-2 font-medium text-xs text-[var(--wm-muted)] hover:text-[var(--wm-ink)] transition-colors text-center"
      >
        {t('optimizeAnother')}
      </button>
    </div>
  );
};

