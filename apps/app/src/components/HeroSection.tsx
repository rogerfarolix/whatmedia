import { useTranslation } from '../i18n/useTranslation';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="text-center pt-2 pb-6">
      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight text-wm-ink">
        {t.hero.title}
      </h1>

      <p className="mt-3 text-base sm:text-lg text-wm-muted max-w-lg mx-auto leading-relaxed">
        {t.hero.subtitle}
      </p>

      {/* 3 feature pills */}
      <div
        className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm"
        role="list"
        aria-label="Caractéristiques principales"
      >
        <span
          role="listitem"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wm-surface border border-wm-border text-wm-ink font-medium shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-wm-ok shrink-0" aria-hidden="true" />
          {t.pills.local}
        </span>

        <span
          role="listitem"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wm-surface border border-wm-border text-wm-ink font-medium shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-wm-signal shrink-0" aria-hidden="true" />
          {t.pills.free}
        </span>

        <span
          role="listitem"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-wm-surface border border-wm-border text-wm-ink font-medium shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-wm-focus shrink-0" aria-hidden="true" />
          {t.pills.openSource}
        </span>
      </div>
    </section>
  );
}
