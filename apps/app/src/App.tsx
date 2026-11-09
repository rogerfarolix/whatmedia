import { useRef, type ChangeEvent } from 'react';
import { useMediaStore } from './store/useMediaStore';
import { useTranslation } from './i18n/useTranslation';
import { Header } from './components/Header';
import { InstallBanner } from './components/InstallBanner';
import { HeroSection } from './components/HeroSection';
import { FileUploader } from './components/FileUploader';
import { MediaPreviewCard } from './components/MediaPreviewCard';
import { PresetSelector } from './components/PresetSelector';
import { ShareSection } from './components/ShareSection';
import { Footer } from './components/Footer';
import { PlusIcon } from './components/icons/Icons';

export function App() {
  const selectedFiles = useMediaStore((s) => s.selectedFiles);
  const addSelectedFiles = useMediaStore((s) => s.addSelectedFiles);
  const removeFile = useMediaStore((s) => s.removeFile);
  const clearFiles = useMediaStore((s) => s.clearFiles);
  const { t } = useTranslation();

  const additionalInputRef = useRef<HTMLInputElement>(null);

  const handleAddMoreFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addSelectedFiles(Array.from(e.target.files));
      if (additionalInputRef.current) {
        additionalInputRef.current.value = '';
      }
    }
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-wm-paper text-wm-ink transition-colors">
      <Header />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 md:py-8 flex flex-col justify-center">
        <InstallBanner />

        {!hasFiles ? (
          <div className="space-y-6 my-auto">
            <HeroSection />
            <FileUploader />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header of selection */}
            <div className="flex items-center justify-between pb-2 border-b border-wm-border/60">
              <div>
                <h2 className="font-heading font-bold text-lg sm:text-xl text-wm-ink">
                  {selectedFiles.length === 1
                    ? t.fileCard.singleSelected
                    : t.fileCard.multipleSelected.replace('{count}', String(selectedFiles.length))}
                </h2>
                <p className="text-xs text-wm-muted mt-0.5">
                  {t.fileCard.originalFile}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Hidden input to add more files */}
                <input
                  ref={additionalInputRef}
                  type="file"
                  accept="video/*,image/*"
                  multiple
                  onChange={handleAddMoreFiles}
                  className="sr-only"
                  id="add-more-input"
                />
                <button
                  type="button"
                  onClick={() => additionalInputRef.current?.click()}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-wm-border bg-wm-surface hover:bg-wm-surface-elevated text-xs font-semibold text-wm-ink flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus transition-all"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>{t.fileCard.addFiles}</span>
                </button>

                <button
                  type="button"
                  onClick={clearFiles}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-wm-muted hover:text-wm-warn transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wm-focus cursor-pointer"
                >
                  {t.fileCard.clearAll}
                </button>
              </div>
            </div>

            {/* Media list */}
            <div className="space-y-2.5" role="list" aria-label="Fichiers sélectionnés">
              {selectedFiles.map((file, idx) => (
                <MediaPreviewCard
                  key={`${file.name}-${file.lastModified}-${idx}`}
                  file={file}
                  index={idx}
                  onRemove={removeFile}
                />
              ))}
            </div>

            {/* WhatsApp Preset preview & selection */}
            <PresetSelector />

            {/* Direct Share section (Task 1.5) */}
            <ShareSection />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
