import { useMediaStore } from '../store/useMediaStore';
import { useTranslation } from '../i18n/useTranslation';
import { CloseIcon, ShareIcon, AddHomeScreenIcon } from './icons/Icons';

export function InstallBanner() {
  const isVisible = useMediaStore((s) => s.isInstallBannerVisible);
  const dismiss = useMediaStore((s) => s.dismissInstallBanner);
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <aside
      aria-label={t.installBanner.title}
      className="relative mb-6 rounded-2xl border border-wm-signal/30 bg-wm-signal-light/60 p-4 md:p-5 text-wm-ink shadow-sm backdrop-blur-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-wm-signal text-white flex items-center justify-center shrink-0 shadow-xs">
            <AddHomeScreenIcon className="w-4 h-4" />
          </div>
          <h2 className="font-heading font-semibold text-base md:text-lg text-wm-ink">
            {t.installBanner.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label={t.installBanner.closeAria}
          className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-full text-wm-muted hover:text-wm-ink hover:bg-wm-signal/10 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus cursor-pointer"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <p className="mt-1 text-sm text-wm-muted">
        {t.installBanner.subtitle}
      </p>

      {/* 2-step visual instructions */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm font-medium">
        <div className="flex items-center gap-2.5 rounded-xl bg-wm-surface/90 border border-wm-border/60 px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-wm-focus-light text-wm-focus flex items-center justify-center shrink-0">
            <ShareIcon className="w-4 h-4" />
          </div>
          <div>
            <span>{t.installBanner.instructionShare} </span>
            <strong className="text-wm-focus font-semibold">{t.installBanner.shareWord}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-wm-surface/90 border border-wm-border/60 px-3 py-2.5">
          <div className="w-7 h-7 rounded-lg bg-wm-signal-light text-wm-signal flex items-center justify-center shrink-0">
            <AddHomeScreenIcon className="w-4 h-4" />
          </div>
          <div>
            <span>{t.installBanner.instructionAdd} </span>
            <strong className="text-wm-signal font-semibold">{t.installBanner.addWord}</strong>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={dismiss}
          className="text-xs font-medium text-wm-muted hover:text-wm-ink underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus rounded py-1 px-1 cursor-pointer"
        >
          {t.installBanner.dismiss}
        </button>
      </div>
    </aside>
  );
}
