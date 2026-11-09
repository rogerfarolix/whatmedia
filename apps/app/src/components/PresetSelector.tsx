import { presets, type PresetId } from '@whatmedia/config';
import { useMediaStore } from '../store/useMediaStore';
import { useTranslation } from '../i18n/useTranslation';
import { SparklesIcon } from './icons/Icons';

export function PresetSelector() {
  const currentPresetId = useMediaStore((s) => s.currentPresetId);
  const setPreset = useMediaStore((s) => s.setPreset);
  const { t, lang } = useTranslation();

  const presetList = Object.entries(presets) as [PresetId, (typeof presets)[PresetId]][];

  return (
    <section aria-label={t.presets.title} className="w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-heading font-semibold text-sm sm:text-base text-wm-ink flex items-center gap-1.5">
          <SparklesIcon className="w-4 h-4 text-wm-signal" />
          {t.presets.title}
        </h3>
        <span className="text-xs text-wm-muted font-medium">
          {t.presets.selectLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {presetList.map(([id, preset]) => {
          const isSelected = id === currentPresetId;
          const label = preset.label[lang] || preset.label.fr;
          const description = preset.description[lang] || preset.description.fr;
          const resolution =
            preset.kind === 'video'
              ? `${preset.video.width}×${preset.video.height}`
              : `${preset.image.width}×${preset.image.height}`;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setPreset(id)}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-wm-signal bg-wm-signal-light/40 ring-1 ring-wm-signal/30'
                  : 'border-wm-border bg-wm-surface hover:border-wm-border/90 hover:bg-wm-surface-elevated'
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-wm-ink">
                    {label}
                  </span>
                  {preset.default && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-wm-signal text-white">
                      {t.presets.recommended}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-wm-muted line-clamp-2">
                  {description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-wm-border/50 flex items-center justify-between text-[11px] text-wm-muted font-mono">
                <span>{resolution}</span>
                <span className="uppercase">{preset.kind}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
