import React from 'react';
import type { PresetId } from '@whatmedia/config';
import { whatsappLimits } from '@whatmedia/config';
import type { MediaInfo, Plan, PlanNote } from '@whatmedia/core';
import { useTranslation, type TranslationKey } from '../i18n/useTranslation';
import { formatBytes, formatDuration, LARGE_FILE_BYTES } from '../utils/format';
import { PresetSelector } from './PresetSelector';

interface Props {
  file: File;
  info: MediaInfo | null;
  plan: Plan | null;
  isAnalyzing: boolean;
  presetId: PresetId;
  onSelectPreset: (id: PresetId) => void;
  segmentSec: number;
  onSelectSegmentSec: (s: number) => void;
  crop916?: boolean;
  onToggleCrop916?: (val: boolean) => void;
  queueIndex?: number;
  queueTotal?: number;
  canOptimize: boolean;
  onOptimize: () => void;
  onServerFallback?: () => void;
  onCancel: () => void;
}

const NOTE_KEYS: Record<PlanNote, TranslationKey | null> = {
  'resolution-reduced': 'noteResolutionReduced',
  'split-for-size': 'noteSplitForSize',
  'shorter-segments-sharper': 'noteShorterSharper',
  'hdr-converted': null, // shown as the dedicated HDR block
};

const Stat: React.FC<{ label: string; value: React.ReactNode; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="p-3 rounded-lg bg-[var(--wm-paper)] border border-[var(--wm-border)] min-w-0">
    <dt className="text-xs text-[var(--wm-muted)]">{label}</dt>
    <dd className={`font-semibold truncate ${accent ? 'text-[var(--wm-signal-text)]' : 'text-[var(--wm-ink)]'}`}>
      {value}
    </dd>
  </div>
);

export const AnalysisScreen: React.FC<Props> = ({
  file,
  info,
  plan,
  isAnalyzing,
  presetId,
  onSelectPreset,
  segmentSec,
  onSelectSegmentSec,
  crop916 = false,
  onToggleCrop916,
  queueIndex,
  queueTotal,
  canOptimize,
  onOptimize,
  onServerFallback,
  onCancel,
}) => {
  const { t, language } = useTranslation();
  const segGroupId = React.useId();

  if (isAnalyzing) {
    return (
      <section
        aria-busy="true"
        className="flex flex-col items-center justify-center p-8 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)] text-center"
      >
        <div
          aria-hidden="true"
          className="w-10 h-10 border-4 border-[var(--wm-signal)] border-t-transparent rounded-full motion-safe:animate-spin mb-4"
        />
        <h2 className="text-lg font-bold font-heading text-[var(--wm-ink)] mb-1" role="status">
          {t('analyzingMedia')}
        </h2>
        <p className="text-sm text-[var(--wm-muted)] break-all">{file.name}</p>
      </section>
    );
  }

  const isVideo = info?.kind !== 'image';
  const segmentCount = plan?.segments.length ?? 1;
  const isStatusVideo = isVideo && presetId.startsWith('status-') && presetId !== 'status-photo';
  const notes = (plan?.notes ?? [])
    .map((n) => NOTE_KEYS[n])
    .filter((k): k is TranslationKey => k !== null);

  const output =
    plan?.video
      ? t('outputSummaryVideo', {
          w: plan.video.width,
          h: plan.video.height,
          fps: plan.video.fps,
          mbps: (plan.video.bitrate / 1e6).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
            maximumFractionDigits: 1,
          }),
        })
      : plan?.image
        ? t('outputSummaryImage', { w: plan.image.width, h: plan.image.height })
        : '-';

  return (
    <section
      aria-labelledby="analysis-title"
      className="flex flex-col gap-5 p-5 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)]"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-wide text-[var(--wm-signal-text)] uppercase">
            {t('analysisResult')}
          </span>
          {queueTotal !== undefined && queueTotal > 1 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--wm-paper)] border border-[var(--wm-border)] font-mono text-[var(--wm-muted)]">
              {t('queueBadge', { i: (queueIndex ?? 0) + 1, n: queueTotal })}
            </span>
          )}
        </div>
        <h2 id="analysis-title" className="text-xl font-bold font-heading text-[var(--wm-ink)] mt-0.5 truncate">
          {file.name}
        </h2>
      </div>

      {info && (
        <dl className="grid grid-cols-2 gap-3 text-sm m-0">
          {isVideo && <Stat label={t('duration')} value={formatDuration(info.durationSec ?? 0)} />}
          <Stat label={t('resolution')} value={info.width > 0 ? `${info.width} × ${info.height}` : '-'} />
          <Stat label={t('fileSize')} value={formatBytes(info.sizeBytes, language)} />
          {isVideo ? (
            <Stat
              label={t('targetSegments')}
              value={segmentCount > 1 ? t('parts', { n: segmentCount }) : t('singlePart')}
              accent
            />
          ) : (
            <Stat label={t('codec')} value={info.container.toUpperCase()} />
          )}
          <div className="col-span-2">
            <Stat label={t('outputLabel')} value={output} />
          </div>
        </dl>
      )}

      {info && info.sizeBytes > LARGE_FILE_BYTES && (
        <p className="text-xs text-[var(--wm-muted)]">
          {t('largeFileWarning', { size: formatBytes(info.sizeBytes, language) })}
        </p>
      )}

      {info?.hdr && info.hdr !== 'none' && (
        <div className="p-3 rounded-lg bg-[var(--wm-signal-light)] border border-[var(--wm-signal)] text-xs text-[var(--wm-ink)]">
          <strong>{t('hdrBadge', { type: info.hdr.toUpperCase() })}</strong> {t('hdrHint')}
        </div>
      )}

      {notes.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-xs text-[var(--wm-ink)] p-3 rounded-lg bg-[var(--wm-focus-light)] border border-[var(--wm-focus)] list-none m-0">
          {notes.map((k) => (
            <li key={k}>{t(k, { n: segmentCount })}</li>
          ))}
        </ul>
      )}

      {isVideo && info && (
        <PresetSelector selectedPresetId={presetId} onSelectPreset={onSelectPreset} kind="video" />
      )}

      {isStatusVideo && (info?.durationSec ?? 0) > Math.min(...whatsappLimits.allowedStatusVideoSec) && (
        <fieldset className="flex flex-col gap-2 border-0 p-0 m-0 min-w-0">
          <legend id={segGroupId} className="text-xs font-semibold text-[var(--wm-muted)] uppercase tracking-wider mb-2">
            {t('segmentSectionTitle')}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {whatsappLimits.allowedStatusVideoSec.map((s) => {
              const checked = segmentSec === s;
              return (
                <label
                  key={s}
                  className={`min-h-11 flex items-center justify-center rounded-[var(--wm-radius-button)] border text-sm font-semibold cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--wm-focus)] ${
                    checked
                      ? 'border-[var(--wm-signal)] bg-[var(--wm-signal-light)] text-[var(--wm-signal-text)]'
                      : 'border-[var(--wm-border)] text-[var(--wm-ink)] hover:border-[var(--wm-muted)]'
                  }`}
                >
                  <input
                    type="radio"
                    name={`segment-${segGroupId}`}
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

      {info && info.kind === 'video' && info.width > info.height && (
        <label className="flex items-start gap-3 p-3 min-h-11 rounded-lg bg-[var(--wm-paper)] border border-[var(--wm-border)] cursor-pointer hover:border-[var(--wm-signal)] transition-colors">
          <input
            type="checkbox"
            checked={crop916}
            onChange={(e) => onToggleCrop916?.(e.target.checked)}
            className="mt-0.5 accent-[var(--wm-signal)] w-5 h-5 shrink-0 cursor-pointer"
          />
          <span className="flex flex-col text-xs">
            <span className="font-semibold text-[var(--wm-ink)]">{t('cropVerticalLabel')}</span>
            <span className="text-[11px] text-[var(--wm-muted)]">{t('cropVerticalHint')}</span>
          </span>
        </label>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 min-h-11 py-3 rounded-[var(--wm-radius-button)] font-medium text-sm text-[var(--wm-ink)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] transition-colors"
        >
          {t('changeFile')}
        </button>
        <button
          type="button"
          onClick={onOptimize}
          disabled={!canOptimize || !plan}
          className="flex-[2] min-h-11 py-3 rounded-[var(--wm-radius-button)] font-semibold text-sm bg-[var(--wm-signal)] text-[var(--wm-on-signal)] hover:bg-[var(--wm-signal-hover)] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('startOptimization')}
        </button>
      </div>

      {onServerFallback && (
        <div className="text-center pt-1 border-t border-[var(--wm-border)]">
          <button
            type="button"
            onClick={onServerFallback}
            className="min-h-11 text-xs text-[var(--wm-muted)] hover:text-[var(--wm-ink)] underline transition-colors"
          >
            {t('serverFallbackLink')}
          </button>
        </div>
      )}
    </section>
  );
};
