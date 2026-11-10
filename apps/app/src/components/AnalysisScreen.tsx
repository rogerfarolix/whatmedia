import React from 'react';
import type { MediaInfo, Plan } from '@whatmedia/core';
import { useTranslation } from '../i18n/useTranslation';
import { formatBytes, formatDuration } from '../utils/format';

interface Props {
  file: File;
  info: MediaInfo | null;
  plan: Plan | null;
  isAnalyzing: boolean;
  queueIndex?: number;
  queueTotal?: number;
  onOptimize: () => void;
  onServerFallback?: () => void;
  onCancel: () => void;
}

export const AnalysisScreen: React.FC<Props> = ({
  file,
  info,
  plan,
  isAnalyzing,
  queueIndex,
  queueTotal,
  onOptimize,
  onServerFallback,
  onCancel,
}) => {
  const { t } = useTranslation();

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)] text-center animate-pulse">
        <div className="w-10 h-10 border-3 border-[var(--wm-signal)] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold font-heading text-[var(--wm-ink)] mb-1">
          {t('analyzingMedia')}
        </h2>
        <p className="text-sm text-[var(--wm-muted)]">{file.name}</p>
      </div>
    );
  }

  const segmentCount = plan?.segments.length ?? 1;

  return (
    <div className="flex flex-col gap-5 p-5 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)]">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wide text-[var(--wm-signal)] uppercase">
            {t('analysisResult')}
          </span>
          {queueTotal && queueTotal > 1 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--wm-paper)] border border-[var(--wm-border)] font-mono text-[var(--wm-muted)]">
              File d'attente : {(queueIndex ?? 0) + 1} / {queueTotal}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold font-heading text-[var(--wm-ink)] mt-0.5 truncate">
          {file.name}
        </h2>
      </div>

      {info && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-[var(--wm-paper)] border border-[var(--wm-border)]">
            <span className="text-xs text-[var(--wm-muted)] block">{t('duration')}</span>
            <span className="font-semibold text-[var(--wm-ink)]">
              {formatDuration(info.durationSec ?? 0)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--wm-paper)] border border-[var(--wm-border)]">
            <span className="text-xs text-[var(--wm-muted)] block">{t('resolution')}</span>
            <span className="font-semibold text-[var(--wm-ink)]">
              {info.width} × {info.height}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--wm-paper)] border border-[var(--wm-border)]">
            <span className="text-xs text-[var(--wm-muted)] block">{t('fileSize')}</span>
            <span className="font-semibold text-[var(--wm-ink)]">
              {formatBytes(info.sizeBytes)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[var(--wm-paper)] border border-[var(--wm-border)]">
            <span className="text-xs text-[var(--wm-muted)] block">{t('targetSegments')}</span>
            <span className="font-semibold text-[var(--wm-signal)]">
              {segmentCount} {segmentCount > 1 ? t('parts') : t('singlePart')}
            </span>
          </div>
        </div>
      )}

      {info?.hdr !== 'none' && info?.hdr && (
        <div className="p-3 rounded-lg bg-[var(--wm-signal-light)] border border-[var(--wm-signal)] text-xs text-[var(--wm-ink)]">
          <strong>HDR Détecté ({info.hdr.toUpperCase()}) :</strong> WhatMedia corrigera automatiquement la palette pour éviter l'effet délavé sur WhatsApp.
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-[var(--wm-radius-button)] font-medium text-sm text-[var(--wm-muted)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] transition-colors"
        >
          {t('changeFile')}
        </button>
        <button
          type="button"
          onClick={onOptimize}
          className="flex-2 py-3 rounded-[var(--wm-radius-button)] font-semibold text-sm bg-[var(--wm-signal)] text-white hover:bg-[var(--wm-signal-hover)] transition-all shadow-md hover:shadow-lg active:scale-98"
        >
          {t('startOptimization')}
        </button>
      </div>

      {onServerFallback && (
        <div className="text-center pt-1 border-t border-[var(--wm-border)]/60">
          <button
            type="button"
            onClick={onServerFallback}
            className="text-xs text-[var(--wm-muted)] hover:text-[var(--wm-signal)] transition-colors inline-flex items-center gap-1.5"
          >
            <span>☁️</span>
            <span className="underline">Appareil ancien ou lent ? Traiter via notre serveur de secours</span>
          </button>
        </div>
      )}
    </div>
  );
};

