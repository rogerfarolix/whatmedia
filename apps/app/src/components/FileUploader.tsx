import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { useMediaStore } from '../store/useMediaStore';
import { useTranslation } from '../i18n/useTranslation';
import { VideoCameraIcon, ImageIcon } from './icons/Icons';

export function FileUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setSelectedFiles = useMediaStore((s) => s.setSelectedFiles);
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setSelectedFiles(files);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full rounded-3xl border-2 border-dashed p-8 md:p-12 text-center transition-all duration-200 ${
        isDragging
          ? 'border-wm-signal bg-wm-signal-light/80 scale-[1.01]'
          : 'border-wm-border hover:border-wm-signal/60 bg-wm-surface/70'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        multiple
        onChange={handleFileInputChange}
        className="sr-only"
        id="media-file-input"
        aria-label={t.accessibility.openFileDialog}
      />

      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
        {/* Visual icon badge */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-wm-signal-light text-wm-signal flex items-center justify-center shadow-xs">
            <VideoCameraIcon className="w-6 h-6" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-wm-focus-light text-wm-focus flex items-center justify-center shadow-xs">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Big orange button */}
        <button
          type="button"
          onClick={openPicker}
          className="w-full sm:w-auto min-h-[54px] px-8 py-3.5 rounded-full bg-wm-signal hover:bg-wm-signal-hover active:scale-[0.98] text-white font-heading font-bold text-base sm:text-lg shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-wm-signal/30 cursor-pointer"
        >
          {t.upload.button}
        </button>

        {/* Desktop drag & drop hint */}
        <p className="mt-4 text-sm font-medium text-wm-muted hidden sm:block">
          {t.upload.dropzoneTitle}
        </p>

        {/* Accepted formats note */}
        <p className="mt-2 text-xs text-wm-muted/80">
          {t.upload.formats}
        </p>
      </div>
    </div>
  );
}
