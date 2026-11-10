import React from 'react';
import type { OutputFile } from '@whatmedia/core';
import { useTranslation } from '../i18n/useTranslation';
import { formatBytes, formatDuration } from '../utils/format';
import { canShareFiles, downloadFile, shareFiles } from '../utils/share';
import { Icon } from './Icon';

const Preview: React.FC<{ output: OutputFile }> = ({ output }) => {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    const u = URL.createObjectURL(output.file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [output.file]);

  if (!url) return <div className="w-14 h-20 rounded-md bg-[var(--wm-border)] shrink-0" />;
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

interface Props {
  output: OutputFile;
  title: string;
  shared: boolean;
  onShared: () => void;
}

/** One result file: preview, size, Share (or Save when sharing is unavailable) and Save. */
export const OutputRow: React.FC<Props> = ({ output, title, shared, onShared }) => {
  const { t, language } = useTranslation();
  const [busy, setBusy] = React.useState(false);
  const shareSupported = canShareFiles([output.file]);

  const handleShare = async () => {
    setBusy(true);
    if (shareSupported) {
      if (await shareFiles([output.file])) onShared();
    } else {
      downloadFile(output.file);
    }
    setBusy(false);
  };

  return (
    <li className="flex items-center gap-3 p-3 rounded-xl bg-[var(--wm-paper)] border border-[var(--wm-border)]">
      <Preview output={output} />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-semibold text-sm text-[var(--wm-ink)] truncate">{title}</span>
        <span className="text-xs text-[var(--wm-muted)]">
          {output.durationSec > 0 ? `${formatDuration(output.durationSec)} · ` : ''}
          {formatBytes(output.sizeBytes, language)}
        </span>
        {shared && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--wm-ok)]">
            <Icon name="check" className="w-3.5 h-3.5" strokeWidth={2.5} />
            {t('shared')}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          aria-label={`${shareSupported ? t('shareToStatus') : t('download')}, ${title}`}
          className="min-h-11 px-4 rounded-[var(--wm-radius-button)] font-semibold text-xs bg-[var(--wm-signal)] text-[var(--wm-on-signal)] hover:bg-[var(--wm-signal-hover)] transition-all shadow-sm whitespace-nowrap disabled:opacity-60"
        >
          {busy ? t('sharing') : shareSupported ? t('shareToStatus') : t('download')}
        </button>
        {shareSupported && (
          <button
            type="button"
            onClick={() => downloadFile(output.file)}
            aria-label={`${t('download')}, ${title}`}
            className="min-h-11 px-4 rounded-[var(--wm-radius-button)] text-xs text-[var(--wm-ink)] border border-[var(--wm-border)] hover:bg-[var(--wm-surface)] whitespace-nowrap"
          >
            {t('download')}
          </button>
        )}
      </div>
    </li>
  );
};
