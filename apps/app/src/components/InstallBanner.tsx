import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { useMediaStore } from '../store/useMediaStore';
import { setInstallBannerDismissed } from '../utils/storage';

export const InstallBanner: React.FC = () => {
  const { t } = useTranslation();
  const { isInstallBannerVisible, setInstallBannerVisible } = useMediaStore();

  if (!isInstallBannerVisible) return null;

  const handleDismiss = () => {
    setInstallBannerDismissed();
    setInstallBannerVisible(false);
  };

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--wm-focus-light)] border border-[var(--wm-focus)] text-xs text-[var(--wm-ink)] shadow-sm">
      <div className="flex items-center gap-3 pr-2">
        <span className="text-lg">📲</span>
        <div>
          <strong className="block font-semibold">{t('installPrompt')}</strong>
          <span className="text-[var(--wm-muted)]">{t('installInstructions')}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="px-2.5 py-1 text-[11px] font-medium text-[var(--wm-muted)] hover:text-[var(--wm-ink)] rounded-md hover:bg-black/5 transition-colors whitespace-nowrap"
      >
        {t('dismiss')}
      </button>
    </div>
  );
};
