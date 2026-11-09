import { useState } from 'react';
import { useMediaStore } from '../store/useMediaStore';
import { useTranslation } from '../i18n/useTranslation';
import { ShareIcon, DownloadIcon, CheckCircleIcon } from './icons/Icons';

type ShareStatus = 'idle' | 'sharing' | 'success' | 'cancelled' | 'error' | 'downloaded';

export function ShareSection() {
  const selectedFiles = useMediaStore((s) => s.selectedFiles);
  const { t } = useTranslation();
  const [status, setStatus] = useState<ShareStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check Web Share API files support
  const canWebShareFiles = (): boolean => {
    if (typeof navigator === 'undefined' || !('share' in navigator)) return false;
    if (selectedFiles.length === 0) return false;
    try {
      if (typeof navigator.canShare === 'function') {
        return navigator.canShare({ files: selectedFiles });
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleShare = async () => {
    if (selectedFiles.length === 0) return;
    setStatus('sharing');
    setErrorMessage(null);

    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share({
          files: selectedFiles,
          title: 'WhatMedia',
          text: 'WhatMedia — Statut optimisé',
        });
        setStatus('success');
      } else {
        // Fallback to download if navigator.share doesn't exist
        handleDownloadAll();
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('cancelled');
      } else {
        setStatus('error');
        setErrorMessage(t.share.shareFailed);
      }
    }
  };

  const handleDownloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('downloaded');
  };

  const handleDownloadAll = () => {
    selectedFiles.forEach((file) => {
      handleDownloadFile(file);
    });
  };

  const isShareSupported = canWebShareFiles();

  return (
    <div className="w-full rounded-2xl bg-wm-surface border border-wm-border p-4 sm:p-5 shadow-xs space-y-4">
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isShareSupported ? (
          <button
            type="button"
            onClick={handleShare}
            disabled={status === 'sharing'}
            className="flex-1 min-h-[52px] px-6 py-3.5 rounded-full bg-wm-signal hover:bg-wm-signal-hover active:scale-[0.98] text-white font-heading font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-wm-signal/30 disabled:opacity-50"
          >
            <ShareIcon className="w-5 h-5 shrink-0" />
            <span>
              {selectedFiles.length > 1
                ? t.share.shareMultipleButton.replace('{count}', String(selectedFiles.length))
                : t.share.shareButton}
            </span>
          </button>
        ) : null}

        {/* Fallback download button (always available or primary if share not supported) */}
        <button
          type="button"
          onClick={handleDownloadAll}
          className={`${
            isShareSupported
              ? 'sm:w-auto px-5 py-3.5 rounded-full border border-wm-border bg-wm-surface hover:bg-wm-surface-elevated text-wm-ink font-semibold'
              : 'w-full py-3.5 rounded-full bg-wm-signal hover:bg-wm-signal-hover text-white font-heading font-bold shadow-sm'
          } min-h-[52px] text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus active:scale-[0.98]`}
        >
          <DownloadIcon className="w-5 h-5 shrink-0" />
          <span>
            {selectedFiles.length > 1
              ? `${t.share.downloadButton} (${selectedFiles.length})`
              : t.share.downloadButton}
          </span>
        </button>
      </div>

      {/* Live status notification */}
      <div aria-live="polite" className="text-center text-xs sm:text-sm">
        {status === 'sharing' && (
          <p className="text-wm-muted animate-pulse">{t.share.sharingInProgress}</p>
        )}
        {status === 'success' && (
          <p className="text-wm-ok flex items-center justify-center gap-1.5 font-medium">
            <CheckCircleIcon className="w-4 h-4 shrink-0" />
            {t.share.shareSuccess}
          </p>
        )}
        {status === 'cancelled' && (
          <p className="text-wm-muted font-medium">{t.share.shareCancelled}</p>
        )}
        {status === 'downloaded' && (
          <p className="text-wm-ok flex items-center justify-center gap-1.5 font-medium">
            <CheckCircleIcon className="w-4 h-4 shrink-0" />
            {t.share.downloadSuccess}
          </p>
        )}
        {status === 'error' && (
          <p className="text-wm-warn font-medium">{errorMessage || t.share.shareFailed}</p>
        )}
      </div>

      {/* WhatsApp HD tip card */}
      <div className="rounded-xl bg-wm-focus-light/50 border border-wm-focus/20 p-3 text-xs text-wm-ink flex items-start gap-2.5">
        <span className="text-base" aria-hidden="true">💡</span>
        <p className="leading-relaxed">
          {t.share.tipHd}
        </p>
      </div>
    </div>
  );
}
