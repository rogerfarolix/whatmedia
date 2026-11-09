import { useState, useEffect } from 'react';
import { formatBytes, getFileCategory } from '../utils/format';
import { useTranslation } from '../i18n/useTranslation';
import { VideoCameraIcon, ImageIcon, TrashIcon } from './icons/Icons';

interface MediaPreviewCardProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
}

export function MediaPreviewCard({ file, index, onRemove }: MediaPreviewCardProps) {
  const { t, lang } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const category = getFileCategory(file);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const categoryLabel =
    category === 'video'
      ? t.fileCard.videoLabel
      : category === 'image'
      ? t.fileCard.imageLabel
      : t.fileCard.otherLabel;

  return (
    <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-wm-surface border border-wm-border shadow-xs hover:border-wm-border/80 transition-all">
      {/* Thumbnail preview */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-wm-ink/5 dark:bg-wm-surface-elevated overflow-hidden shrink-0 flex items-center justify-center border border-wm-border/50">
        {previewUrl ? (
          category === 'video' ? (
            <video
              src={previewUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          category === 'video' ? (
            <VideoCameraIcon className="w-8 h-8 text-wm-muted" />
          ) : (
            <ImageIcon className="w-8 h-8 text-wm-muted" />
          )
        )}

        {/* Small badge icon */}
        <div className="absolute bottom-1 right-1 p-1 rounded-md bg-wm-ink/80 text-white backdrop-blur-xs">
          {category === 'video' ? (
            <VideoCameraIcon className="w-3 h-3" />
          ) : (
            <ImageIcon className="w-3 h-3" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-medium text-sm sm:text-base text-wm-ink truncate"
          title={file.name}
        >
          {file.name}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-wm-muted">
          <span className="font-mono font-medium text-wm-ink/90">
            {formatBytes(file.size, lang)}
          </span>
          <span className="text-wm-muted/40">•</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-wm-border/40 font-medium text-wm-ink/80">
            {categoryLabel} {file.type ? `(${file.type.split('/')[1]?.toUpperCase()})` : ''}
          </span>
        </div>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label={`${t.fileCard.clearAll}: ${file.name}`}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-wm-muted hover:text-wm-warn hover:bg-wm-warn-light/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus cursor-pointer"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
