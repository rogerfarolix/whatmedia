import React from 'react';
import type { PresetId } from '@whatmedia/config';
import { whatsappLimits } from '@whatmedia/config';
import { useTranslation } from '../i18n/useTranslation';
import { formatBytes, formatDuration } from '../utils/format';
import type { BatchItem } from '../store/useMediaStore';
import { PresetSelector } from './PresetSelector';

interface Props {
  items: BatchItem[];
  presetId: PresetId;
  onSelectPreset: (id: PresetId) => void;
  segmentSec: number;
  onSelectSegmentSec: (s: number) => void;
  onRemove: (id: string) => void;
  onStart: () => void;
  onCancel: () => void;
}

const isImage = (item: BatchItem) => (item.info?.kind ?? (item.file.type.startsWith('image/') ? 'image' : 'video')) === 'image';

export const BatchScreen: React.FC<Props> = ({
  items,
  presetId,
  onSelectPreset,
  segmentSec,
  onSelectSegmentSec,
  onRemove,
  onStart,
  onCancel,
}) => {
  const { t, language } = useTranslation();
  const segGroupId = React.useId();
  const videos = items.filter((i) => !isImage(i)).length;
  const photos = items.length - videos;
  const analyzing = items.some((i) => i.status === 'analyzing');
  const ready = items.filter((i) => i.status === 'pending').length;
  const longestVideo = Math.max(0, ...items.filter((i) => !isImage(i)).map((i) => i.info?.durationSec ?? 0));
  const showSegments = videos > 0 && presetId.startsWith('status-') && longestVideo > Math.min(...whatsappLimits.allowedStatusVideoSec);

  return (
    <section
      aria-labelledby="batch-title"
      className="flex flex-col gap-5 p-5 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)]"
    >
      <div>
        <span className="text-xs font-bold tracking-wide text-[var(--wm-signal-text)] uppercase">{t('batchKicker')}</span>
        <h2 id="batch-title" className="text-xl font-semibold text-[var(--wm-ink)] mt-0.5">
          {t('batchTitle', { n: items.length })}
        </h2>
        <p className="text-sm text-[var(--wm-muted)] m-0 mt-1">{t('batchSummary', { v: videos, p: photos })}</p>
      </div>

      <ul className="flex flex-col gap-2 list-none m-0 p-0" aria-busy={analyzing}>
        {items.map((item) => {
          const img = isImage(item);
          const detail =
            item.status === 'analyzing'
              ? t('batchAnalyzing')
              : item.status === 'error'
                ? t('batchNeedsServer')
                : [
                    !img && item.info?.durationSec ? formatDuration(item.info.durationSec) : null,
                    item.info && item.info.width > 0 ? `${item.info.width} × ${item.info.height}` : null,
                    formatBytes(item.file.size, language),
                  ]
                    .filter(Boolean)
                    .join(' · ');
          return (
            <li key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--wm-paper)] border border-[var(--wm-border)]">
              <span
                aria-hidden="true"
                className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center bg-[var(--wm-signal-light)] text-[var(--wm-signal-text)] text-xs font-bold"
              >
                {img ? 'IMG' : 'VID'}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-[var(--wm-ink)] truncate">{item.file.name}</span>
                <span className={`text-xs ${item.status === 'error' ? 'text-[var(--wm-ink)]' : 'text-[var(--wm-muted)]'}`}>{detail}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={t('batchRemove', { name: item.file.name })}
                className="min-w-11 min-h-11 flex items-center justify-center rounded-md text-[var(--wm-muted)] hover:text-[var(--wm-ink)]"
              >
                <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      {videos > 0 && (
        <>
          <PresetSelector selectedPresetId={presetId} onSelectPreset={onSelectPreset} kind="video" />
          {showSegments && (
            <fieldset className="flex flex-col gap-2 border-0 p-0 m-0 min-w-0">
              <legend className="text-xs font-semibold text-[var(--wm-muted)] uppercase tracking-wider mb-2">
                {t('segmentSectionTitle')}
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {whatsappLimits.allowedStatusVideoSec.map((s) => {
                  const checked = segmentSec === s;
                  return (
                    <label
                      key={s}
                      className={`min-h-11 flex items-center justify-center rounded-[var(--wm-radius-button)] border text-sm font-semibold cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--wm-focus)] ${
                        checked
                          ? 'border-[var(--wm-signal)] bg-[var(--wm-signal-light)] text-[var(--wm-signal-text)]'
                          : 'border-[var(--wm-border)] text-[var(--wm-ink)] hover:border-[var(--wm-muted)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`batch-segment-${segGroupId}`}
                        value={s}
                        checked={checked}
                        onChange={() => onSelectSegmentSec(s)}
                        className="sr-only"
                      />
                      {t('segmentOption', { s })}
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--wm-muted)] m-0">{t('segmentHint')}</p>
            </fieldset>
          )}
        </>
      )}

      {photos > 0 && <p className="text-xs text-[var(--wm-muted)] m-0">{t('batchPhotoNote')}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-11 py-3 rounded-[var(--wm-radius-button)] font-medium text-sm text-[var(--wm-ink)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)]"
        >
          {t('changeFile')}
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={analyzing || ready === 0}
          className="flex-[2] min-h-11 py-3 rounded-[var(--wm-radius-button)] font-semibold text-sm bg-[var(--wm-signal)] text-[var(--wm-on-signal)] hover:bg-[var(--wm-signal-hover)] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? t('batchAnalyzing') : t('batchStart', { n: ready })}
        </button>
      </div>
    </section>
  );
};
