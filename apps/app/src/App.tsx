import React from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { InstallBanner } from './components/InstallBanner';
import { FileUploader } from './components/FileUploader';
import { PresetSelector } from './components/PresetSelector';
import { AnalysisScreen } from './components/AnalysisScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ConsentModal } from './components/ConsentModal';
import { ErrorBanner } from './components/ErrorBanner';
import { Footer } from './components/Footer';
import { useMediaStore, type ProcessingLane } from './store/useMediaStore';
import type { PresetId } from '@whatmedia/config';
import { whatsappLimits } from '@whatmedia/config';
import type { Capabilities, MediaError, MediaInfo, OutputFile } from '@whatmedia/core';
import { loadEngine } from './utils/loadEngine';
import { runServerJob, checkServerAvailable, ServerError } from './utils/serverClient';
import { normalizeMediaFile, MAX_LOCAL_BYTES, formatBytes } from './utils/format';
import { useTranslation, type TranslationKey } from './i18n/useTranslation';
import { useWakeLock } from './utils/useWakeLock';

export interface AppError {
  key: TranslationKey;
  vars?: Record<string, string | number>;
  /** Offer the fallback server as a way out of this error */
  offerServer?: boolean;
}

/** Duck-typed so the engine module can stay lazily loaded */
function asMediaError(err: unknown): MediaError | null {
  return (err as { name?: string })?.name === 'MediaError' ? (err as MediaError) : null;
}

function errorKeyFor(err: unknown): TranslationKey {
  const mediaErr = asMediaError(err);
  if (mediaErr) {
    switch (mediaErr.code) {
      case 'E_UNSUPPORTED_CODEC':
        return 'errorUnsupportedCodec';
      case 'E_UNSUPPORTED_IMAGE':
        return 'errorUnsupportedImage';
      case 'E_TOO_LARGE':
        return 'errorTooLarge';
      default:
        return 'errorGeneric';
    }
  }
  return 'errorGeneric';
}

function isAbort(err: unknown): boolean {
  return (
    asMediaError(err)?.code === 'E_ABORTED' ||
    (err as { name?: string })?.name === 'AbortError'
  );
}

export const App: React.FC = () => {
  const { t, language } = useTranslation();
  const store = useMediaStore();
  const {
    screen,
    selectedFile,
    fileQueue,
    currentFileIndex,
    mediaInfo,
    plan: currentPlan,
    currentPresetId,
    progress,
    outputFiles,
    isAnalyzing,
    segmentSec,
    crop916,
    lane,
    setScreen,
    setSelectedFile,
    setFileQueue,
    setCurrentFileIndex,
    setMediaInfo,
    setPlan,
    setCurrentPresetId,
    setProgress,
    setOutputFiles,
    setIsAnalyzing,
    setSegmentSec,
    setCrop916,
    setLane,
    resetAll,
  } = store;

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const capsRef = React.useRef<Capabilities | null>(null);
  const startedAtRef = React.useRef<number>(0);
  const [consent, setConsent] = React.useState<{ open: boolean; reason?: string }>({ open: false });
  const [error, setError] = React.useState<AppError | null>(null);
  const [serverAvailable, setServerAvailable] = React.useState(false);
  const [partial, setPartial] = React.useState(false);

  const processing = screen === 'processing';
  useWakeLock(processing);

  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  React.useEffect(() => {
    void checkServerAvailable().then(setServerAvailable);
    // Warm the engine chunk once the UI is idle, so the first analysis starts instantly.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(() => void loadEngine());
    else setTimeout(() => void loadEngine(), 1500);
  }, []);

  // Warn before leaving the page while a file is being processed.
  React.useEffect(() => {
    if (!processing) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [processing]);

  const getCaps = async () => {
    capsRef.current ??= await (await loadEngine()).detectCapabilities();
    return capsRef.current;
  };

  const replan = async (
    info: MediaInfo | null,
    presetId: PresetId,
    opts: { segmentSec?: number; crop916?: boolean } = {},
  ) => {
    if (!info) return;
    const caps = await getCaps();
    const { plan } = await loadEngine();
    setPlan(
      plan(info, presetId, caps, {
        segmentDurationSec: opts.segmentSec ?? segmentSec,
        crop916: opts.crop916 ?? crop916,
      }),
    );
  };

  const handleSelectPreset = async (presetId: PresetId) => {
    setCurrentPresetId(presetId);
    await replan(mediaInfo, presetId);
  };

  const handleSegmentSec = async (s: number) => {
    setSegmentSec(s);
    await replan(mediaInfo, currentPresetId, { segmentSec: s });
  };

  const handleToggleCrop916 = async (checked: boolean) => {
    setCrop916(checked);
    await replan(mediaInfo, currentPresetId, { crop916: checked });
  };

  const analyzeFile = async (file: File) => {
    setError(null);
    setPartial(false);
    setSelectedFile(file);
    setMediaInfo(null);
    setPlan(null);
    setCrop916(false);
    setIsAnalyzing(true);
    setScreen('analysis');

    // Photos use the photo preset; videos keep the user's last video preset.
    const isImage = file.type.startsWith('image/');
    const targetPreset: PresetId = isImage ? 'status-photo' : store.lastVideoPresetId;
    if (targetPreset !== currentPresetId) setCurrentPresetId(targetPreset);

    try {
      const { probe, plan } = await loadEngine();
      const info = await probe(file);
      const unreadable =
        (info.kind === 'video' && !(info.width > 0) && !(info.durationSec && info.durationSec > 0)) ||
        (info.kind === 'image' && !(info.width > 0));
      setMediaInfo(info);
      if (unreadable) {
        setError({
          key: info.kind === 'image' ? 'errorUnsupportedImage' : 'errorUnreadable',
          offerServer: true,
        });
      }
      const caps = await getCaps();
      setPlan(plan(info, targetPreset, caps, { segmentDurationSec: segmentSec, crop916: false }));
    } catch (err) {
      console.error('Probe failed:', err);
      setError({ key: 'errorUnreadable', offerServer: true });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const accepted: File[] = [];
    let firstRejection: AppError | null = null;

    for (const raw of files) {
      const f = normalizeMediaFile(raw);
      if (!f) {
        firstRejection ??= { key: 'errorUnsupportedType', vars: { name: raw.name } };
        continue;
      }
      if (f.size > MAX_LOCAL_BYTES) {
        firstRejection ??= {
          key: 'errorTooBig',
          vars: { name: raw.name, max: formatBytes(MAX_LOCAL_BYTES, language, 0) },
        };
        continue;
      }
      accepted.push(f);
    }

    const first = accepted[0];
    if (!first) {
      setError(firstRejection);
      return;
    }
    setFileQueue(accepted);
    setCurrentFileIndex(0);
    await analyzeFile(first);
    if (firstRejection) setError(firstRejection);
  };

  const handleNextInQueue = async () => {
    const nextIdx = currentFileIndex + 1;
    const nextFile = fileQueue[nextIdx];
    if (nextFile) {
      setCurrentFileIndex(nextIdx);
      await analyzeFile(nextFile);
    }
  };

  const startProcessing = (nextLane: ProcessingLane) => {
    setError(null);
    setPartial(false);
    setProgress(null);
    setLane(nextLane);
    startedAtRef.current = performance.now();
    abortControllerRef.current = new AbortController();
    setScreen('processing');
    return abortControllerRef.current.signal;
  };

  const handleOptimize = async () => {
    if (!selectedFile || !currentPlan) return;

    if (currentPlan.engine === 'server') {
      if (serverAvailable) setConsent({ open: true, reason: t('consentReasonFailed', { reason: t('errorUnsupportedCodec') }) });
      else setError({ key: 'errorUnsupportedCodec' });
      return;
    }

    const signal = startProcessing('local');
    const partials: OutputFile[] = [];

    try {
      const { run } = await loadEngine();
      const outputs = await run(selectedFile, currentPlan, {
        signal,
        onProgress: setProgress,
        onSegmentComplete: (item) => partials.push(item),
      });
      setOutputFiles(outputs);
      setScreen('results');
    } catch (err: unknown) {
      const partialOutputs = (err as { partialOutputs?: OutputFile[] })?.partialOutputs ?? partials;

      if (isAbort(err)) {
        if (partialOutputs.length > 0) {
          setOutputFiles(partialOutputs);
          setPartial(true);
          setScreen('results');
        } else {
          setScreen('analysis');
        }
        return;
      }

      console.warn('Local processing failed:', err);
      setScreen('analysis');
      const key = errorKeyFor(err);
      if (serverAvailable) {
        setConsent({ open: true, reason: t('consentReasonFailed', { reason: t(key) }) });
      } else {
        setError({ key });
      }
    }
  };

  const handleConfirmServer = async () => {
    setConsent({ open: false });
    if (!selectedFile) return;

    const signal = startProcessing('server');
    try {
      const outputs = await runServerJob(selectedFile, {
        preset: currentPresetId,
        segmentSec: currentPlan?.segmentSec,
        crop916,
        signal,
        onProgress: setProgress,
      });
      setOutputFiles(outputs);
      setScreen('results');
    } catch (err: unknown) {
      setScreen('analysis');
      if (isAbort(err)) return;
      console.error('Server processing error:', err);
      if (err instanceof ServerError && (err.status === 404 || err.status === 502 || err.status === 503)) {
        setError({ key: 'errorServerUnavailable' });
      } else {
        const reason = (err as { message?: string })?.message || '';
        setError({ key: 'errorServer', vars: { reason } });
      }
    }
  };

  const handleCancelProcessing = () => {
    abortControllerRef.current?.abort();
  };

  const handleReset = () => {
    setError(null);
    setPartial(false);
    resetAll();
  };

  const elapsed = startedAtRef.current ? performance.now() - startedAtRef.current : 0;
  const ratio = progress?.ratio ?? 0;
  const etaMs = ratio > 0.03 && elapsed > 2000 ? (elapsed / ratio) * (1 - ratio) : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--wm-paper)] text-[var(--wm-ink)] transition-colors">
      <Header />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-6" id="main">
        {screen === 'home' && <InstallBanner />}

        {error && (
          <ErrorBanner
            message={t(error.key, error.vars)}
            serverOffer={
              error.offerServer && serverAvailable && selectedFile ? t('serverOfferWithServer') : undefined
            }
            onTryServer={
              error.offerServer && serverAvailable && selectedFile
                ? () => setConsent({ open: true, reason: t('consentReasonFailed', { reason: t(error.key, error.vars) }) })
                : undefined
            }
            onClose={() => setError(null)}
          />
        )}

        {screen === 'home' && (
          <>
            <HeroSection />
            <FileUploader onFilesSelected={handleFilesSelected} />
            <PresetSelector selectedPresetId={currentPresetId} onSelectPreset={handleSelectPreset} />
          </>
        )}

        {screen === 'analysis' && selectedFile && (
          <AnalysisScreen
            file={selectedFile}
            info={mediaInfo}
            plan={currentPlan}
            isAnalyzing={isAnalyzing}
            presetId={currentPresetId}
            onSelectPreset={handleSelectPreset}
            segmentSec={currentPlan?.segmentSec ?? segmentSec ?? whatsappLimits.maxStatusVideoSec}
            onSelectSegmentSec={handleSegmentSec}
            crop916={crop916}
            onToggleCrop916={handleToggleCrop916}
            queueIndex={currentFileIndex}
            queueTotal={fileQueue.length}
            canOptimize={!error?.offerServer}
            onOptimize={handleOptimize}
            onServerFallback={
              serverAvailable ? () => setConsent({ open: true, reason: t('consentReasonManual') }) : undefined
            }
            onCancel={handleReset}
          />
        )}

        {screen === 'processing' && (
          <ProcessingScreen
            ratio={ratio}
            segmentIndex={progress?.segmentIndex ?? 1}
            segmentCount={progress?.segmentCount ?? currentPlan?.segments.length ?? 1}
            lane={lane}
            etaMs={etaMs}
            onCancel={handleCancelProcessing}
          />
        )}

        {screen === 'results' && (
          <ResultsScreen
            outputs={outputFiles}
            partial={partial}
            onReset={handleReset}
            onNextInQueue={currentFileIndex < fileQueue.length - 1 ? handleNextInQueue : undefined}
            nextFileName={
              currentFileIndex < fileQueue.length - 1 ? fileQueue[currentFileIndex + 1]?.name : undefined
            }
            queueRemainingCount={fileQueue.length - 1 - currentFileIndex}
          />
        )}

        <ConsentModal
          isOpen={consent.open}
          reason={consent.reason}
          onConfirm={handleConfirmServer}
          onCancel={() => setConsent({ open: false })}
        />
      </main>

      <Footer />
    </div>
  );
};
export default App;
