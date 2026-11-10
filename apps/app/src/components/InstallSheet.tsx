import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { detectInstallPlatform, promptInstall, type InstallPlatform } from '../utils/installPrompt';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const Step: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <li className="flex gap-3">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--wm-ink)] text-xs font-semibold text-[var(--wm-paper)]">
      {n}
    </span>
    <span className="pt-0.5">{children}</span>
  </li>
);

/** Explains how to install the app on the current device, or shows the native install dialog. */
export const InstallSheet: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const ref = React.useRef<HTMLDialogElement>(null);
  const [platform, setPlatform] = React.useState<InstallPlatform>(() => detectInstallPlatform());
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen) {
      setPlatform(detectInstallPlatform());
      setCopied(false);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const install = async () => {
    await promptInstall();
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Clipboard unavailable: the URL stays visible below
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="install-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-md p-0 m-auto mb-4 sm:mb-auto rounded-[1.75rem] border border-[var(--wm-border)] bg-[var(--wm-surface)] text-[var(--wm-ink)] shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="install-title" className="text-xl font-semibold m-0">
              {t('installTitle')}
            </h2>
            <p className="text-sm text-[var(--wm-muted)] mt-1 mb-0">{t('installBenefit')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="min-w-11 min-h-11 -mr-2 -mt-2 flex items-center justify-center rounded-full text-[var(--wm-muted)] hover:text-[var(--wm-ink)]"
          >
            <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {platform === 'installed' && <p className="text-sm m-0">{t('installDone')}</p>}

        {platform === 'native' && (
          <button
            type="button"
            onClick={install}
            className="min-h-12 rounded-full bg-[var(--wm-ink)] text-[var(--wm-paper)] font-semibold text-sm"
          >
            {t('installNow')}
          </button>
        )}

        {platform === 'ios-safari' && (
          <ol className="flex flex-col gap-3 text-sm list-none m-0 p-0">
            <Step n={1}>
              {t('installIos1')}{' '}
              <svg aria-hidden="true" className="inline w-4 h-4 -mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </Step>
            <Step n={2}>{t('installIos2')}</Step>
            <Step n={3}>{t('installIos3')}</Step>
          </ol>
        )}

        {platform === 'ios-other' && <p className="text-sm m-0">{t('installIosOther')}</p>}
        {platform === 'android-menu' && <p className="text-sm m-0">{t('installAndroid')}</p>}
        {platform === 'desktop-menu' && <p className="text-sm m-0">{t('installDesktop')}</p>}

        {platform === 'in-app' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm m-0">{t('installInApp')}</p>
            <p className="text-xs font-mono break-all rounded-xl bg-[var(--wm-paper)] border border-[var(--wm-border)] p-3 m-0">
              {typeof window !== 'undefined' ? window.location.origin + '/app/' : ''}
            </p>
            <button
              type="button"
              onClick={copyLink}
              className="min-h-12 rounded-full bg-[var(--wm-ink)] text-[var(--wm-paper)] font-semibold text-sm"
            >
              {copied ? t('installLinkCopied') : t('installCopyLink')}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};
