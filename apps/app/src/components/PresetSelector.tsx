import React from 'react';
import type { PresetId } from '@whatmedia/config';
import { presets } from '@whatmedia/config';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  selectedPresetId: PresetId;
  onSelectPreset: (presetId: PresetId) => void;
  /** Restrict to video or image presets (analysis screen); all presets when omitted */
  kind?: 'video' | 'image';
}

const ORDER: PresetId[] = ['status-hd', 'status-light', 'chat-hd', 'chat-compact', 'status-photo'];

export const PresetSelector: React.FC<Props> = ({ selectedPresetId, onSelectPreset, kind }) => {
  const { language, t } = useTranslation();
  const groupId = React.useId();
  const keys = ORDER.filter((k) => presets[k] && (!kind || presets[k]?.kind === kind));

  if (keys.length <= 1) return null;

  return (
    <fieldset className="flex flex-col gap-2.5 border-0 p-0 m-0 min-w-0">
      <legend
        id={groupId}
        className="text-xs font-semibold text-[var(--wm-muted)] uppercase tracking-wider mb-2.5"
      >
        {t('presetSectionTitle')}
      </legend>

      <div className="grid grid-cols-2 gap-2.5">
        {keys.map((key) => {
          const preset = presets[key];
          if (!preset) return null;
          const isSelected = selectedPresetId === key;
          const label = preset.label[language] ?? preset.label.fr;
          const description = preset.description[language] ?? preset.description.fr;

          return (
            <label
              key={key}
              className={`relative flex flex-col items-start p-3 min-h-11 rounded-xl border text-left transition-all cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--wm-focus)] ${
                isSelected
                  ? 'border-[var(--wm-signal)] bg-[var(--wm-signal-light)] shadow-sm'
                  : 'border-[var(--wm-border)] bg-[var(--wm-surface)] hover:border-[var(--wm-muted)]'
              }`}
            >
              <input
                type="radio"
                name={`preset-${groupId}`}
                value={key}
                checked={isSelected}
                onChange={() => onSelectPreset(key)}
                className="sr-only"
              />
              <span className="flex items-center justify-between w-full mb-1">
                <span className={`font-semibold text-xs ${isSelected ? 'text-[var(--wm-signal-text)]' : 'text-[var(--wm-ink)]'}`}>
                  {label}
                </span>
                {isSelected && <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[var(--wm-signal)]" />}
              </span>
              <span className="text-[11px] text-[var(--wm-muted)] line-clamp-2">{description}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
