import React from 'react';
import type { OutputFile } from '@whatmedia/core';
import { useTranslation } from '../i18n/useTranslation';
import { canShareFiles, downloadAll, shareFiles } from '../utils/share';

interface Props {
  outputs: OutputFile[];
  onSharedAll: () => void;
}

/** "Share all" (one share sheet with every file) and "Save all" for multi-file results. */
export const ShareAllBar: React.FC<Props> = ({ outputs, onSharedAll }) => {
  const { t } = useTranslation();
  const [busy, setBusy] = React.useState(false);
  const files = outputs.map((o) => o.file);
  const canShareAll = canShareFiles(files);

  if (outputs.length < 2) return null;

  const handleShareAll = async () => {
    setBusy(true);
    if (await shareFiles(files)) onSharedAll();
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        {canShareAll && (
          <button
            type="button"
            onClick={handleShareAll}
            disabled={busy}
            className="flex-1 min-h-11 rounded-[var(--wm-radius-button)] font-semibold text-sm bg-[var(--wm-signal)] text-[var(--wm-on-signal)] hover:bg-[var(--wm-signal-hover)] shadow-md disabled:opacity-60"
          >
            {busy ? t('sharing') : t('shareAll', { n: outputs.length })}
          </button>
        )}
        <button
          type="button"
          onClick={() => void downloadAll(files)}
          className="flex-1 min-h-11 rounded-[var(--wm-radius-button)] font-medium text-sm text-[var(--wm-ink)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)]"
        >
          {t('saveAllFiles')}
        </button>
      </div>
      {canShareAll && <p className="text-[11px] text-[var(--wm-muted)] m-0">{t('shareAllHint')}</p>}
    </div>
  );
};
