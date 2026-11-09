import { useTranslation } from '../i18n/useTranslation';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t border-wm-border/40 py-8 px-4 text-center text-xs text-wm-muted transition-colors">
      <div className="max-w-2xl mx-auto space-y-3">
        {/* Links & Credits */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-medium">
          <a
            href="https://github.com/rogergnanih/whatmedia"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-wm-ink underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus rounded py-1 px-1"
          >
            {t.footer.github}
          </a>
          <span className="text-wm-border select-none" aria-hidden="true">•</span>
          <a
            href="/confidentialite"
            className="hover:text-wm-ink underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus rounded py-1 px-1"
          >
            {t.footer.privacy}
          </a>
          <span className="text-wm-border select-none" aria-hidden="true">•</span>
          <a
            href="/comment-ca-marche"
            className="hover:text-wm-ink underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus rounded py-1 px-1"
          >
            {t.footer.howItWorks}
          </a>
        </div>

        {/* Author / Nealix credit */}
        <p className="text-wm-muted/80">
          {t.footer.credits}
        </p>

        {/* Mandatory WhatsApp Non-Affiliation Disclaimer */}
        <p className="pt-2 text-[11px] text-wm-muted/60 max-w-md mx-auto leading-normal">
          {t.footer.disclaimer}
        </p>
      </div>
    </footer>
  );
}
