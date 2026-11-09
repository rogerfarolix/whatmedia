import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  onFilesSelected: (files: File[]) => void;
}

export const FileUploader: React.FC<Props> = ({ onFilesSelected }) => {
  const { t } = useTranslation();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center p-8 rounded-[var(--wm-radius-card)] border-2 border-dashed transition-all cursor-pointer ${
        isDragOver
          ? 'border-[var(--wm-signal)] bg-[var(--wm-signal-light)]'
          : 'border-[var(--wm-border)] hover:border-[var(--wm-signal)] bg-[var(--wm-surface)]'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="w-14 h-14 rounded-full bg-[var(--wm-signal-light)] text-[var(--wm-signal)] flex items-center justify-center mb-4 shadow-sm">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      <span className="font-semibold text-base text-[var(--wm-ink)] mb-1 text-center">
        {t('chooseMedia')}
      </span>

      <span className="text-xs text-[var(--wm-muted)] text-center">
        {t('dragDropHint')}
      </span>
    </div>
  );
};
