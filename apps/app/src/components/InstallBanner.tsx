import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useMediaStore } from '../store/useMediaStore';
import { getInstallBannerDismissedTimestamp, setInstallBannerDismissed } from '../utils/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Show the banner again 30 days after it was dismissed */
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export const InstallBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isInstallBannerVisible, setInstallBannerVisible } = useMediaStore();
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    const dismissedAt = getInstallBannerDismissedTimestamp();
    if (isStandalone() || (dismissedAt && Date.now() - dismissedAt < DISMISS_MS)) {
      setInstallBannerVisible(false);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [setInstallBannerVisible]);

  // Only show when there is something actionable: iOS instructions or a native install prompt.
  if (!isInstallBannerVisible || (!isIos() && !deferred)) return null;

  const handleDismiss = () => {
    setInstallBannerDismissed();
    setInstallBannerVisible(false);
  };

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => undefined);
    setDeferred(null);
    setInstallBannerVisible(false);
  };

  return (
    <aside
      aria-label={t('installPrompt')}
      className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-[var(--wm-focus-light)] border border-[var(--wm-focus)] text-xs text-[var(--wm-ink)] shadow-sm"
    >
      <div className="pr-2">
        <strong className="block font-semibold">{t('installPrompt')}</strong>
        {isIos() && <span className="text-[var(--wm-muted)]">{t('installInstructionsIos')}</span>}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {deferred && (
          <button
            type="button"
            onClick={handleInstall}
            className="min-h-11 px-3 rounded-[var(--wm-radius-button)] font-semibold bg-[var(--wm-signal)] text-[var(--wm-on-signal)]"
          >
            {t('installButton')}
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-11 px-2.5 text-[11px] font-medium text-[var(--wm-muted)] hover:text-[var(--wm-ink)] rounded-md transition-colors whitespace-nowrap"
        >
          {t('dismiss')}
        </button>
      </div>
    </aside>
  );
};
