import React from 'react';
import type { PresetId } from '@whatmedia/config';
import { presets } from '@whatmedia/config';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  selectedPresetId: PresetId;
  onSelectPreset: (presetId: PresetId) => void;
}

export const PresetSelector: React.FC<Props> = ({
  selectedPresetId,
  onSelectPreset,
}) => {
  const { language } = useTranslation();
  const presetKeys: PresetId[] = ['status-hd', 'status-light', 'chat-hd', 'chat-compact', 'status-photo'];

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-semibold text-[var(--wm-muted)] uppercase tracking-wider">
        Format & Qualité
      </span>

      <div className="grid grid-cols-2 gap-2.5">
        {presetKeys.map((key) => {
          const preset = presets[key];
          if (!preset) return null;

          const isSelected = selectedPresetId === key;
          const label = preset.label[language] ?? preset.label.fr;
          const description = preset.description[language] ?? preset.description.fr;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectPreset(key)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-[var(--wm-signal)] bg-[var(--wm-signal-light)] shadow-sm'
                  : 'border-[var(--wm-border)] bg-[var(--wm-surface)] hover:border-[var(--wm-muted)]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`font-semibold text-xs ${
                    isSelected ? 'text-[var(--wm-signal)]' : 'text-[var(--wm-ink)]'
                  }`}
                >
                  {label}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-[var(--wm-signal)]" />
                )}
              </div>
              <span className="text-[11px] text-[var(--wm-muted)] line-clamp-2">
                {description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
