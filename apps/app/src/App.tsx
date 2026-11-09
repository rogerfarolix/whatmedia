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
import { Footer } from './components/Footer';
import { useMediaStore } from './store/useMediaStore';
import { probe, plan, run, detectCapabilities } from '@whatmedia/core';
import { runServerJob } from './utils/serverClient';

export const App: React.FC = () => {
  const {
    screen,
    selectedFile,
    mediaInfo,
    plan: currentPlan,
    currentPresetId,
    progress,
    outputFiles,
    isAnalyzing,
    setScreen,
    setSelectedFile,
    setMediaInfo,
    setPlan,
    setCurrentPresetId,
    setProgress,
    setOutputFiles,
    setIsAnalyzing,
    resetAll,
  } = useMediaStore();

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [showConsentModal, setShowConsentModal] = React.useState(false);

  const handleFilesSelected = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setSelectedFile(file);
    setIsAnalyzing(true);
    setScreen('analysis');

    try {
      const caps = await detectCapabilities();
      const info = await probe(file);
      setMediaInfo(info);

      const generatedPlan = plan(info, currentPresetId, caps);
      setPlan(generatedPlan);
    } catch (err) {
      console.error('Probe failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedFile || !currentPlan) return;

    setScreen('processing');
    abortControllerRef.current = new AbortController();

    try {
      const outputs = await run(selectedFile, currentPlan, {
        signal: abortControllerRef.current.signal,
        onProgress: (p) => {
          setProgress(p);
        },
      });

      setOutputFiles(outputs);
      setScreen('results');
    } catch (err: unknown) {
      console.warn('Local processing failed, prompting for server fallback:', err);
      const isAbort =
        (err as { name?: string })?.name === 'AbortError' ||
        (err as { message?: string })?.message?.includes('aborted');

      if (isAbort) {
        setScreen('analysis');
        return;
      }

      setShowConsentModal(true);
    }
  };

  const handleConfirmServerFallback = async () => {
    setShowConsentModal(false);
    if (!selectedFile) return;

    setScreen('processing');
    abortControllerRef.current = new AbortController();

    try {
      const outputs = await runServerJob(selectedFile, {
        preset: currentPresetId,
        signal: abortControllerRef.current.signal,
        onProgress: setProgress,
      });

      setOutputFiles(outputs);
      setScreen('results');
    } catch (err: unknown) {
      console.error('Server processing error:', err);
      const msg = (err as { message?: string })?.message || 'Server processing failed';
      alert(msg);
      setScreen('analysis');
    }
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setScreen('analysis');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--wm-paper)] text-[var(--wm-ink)] transition-colors">
      <Header />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6 flex flex-col gap-6">
        <InstallBanner />

        {screen === 'home' && (
          <>
            <HeroSection />
            <FileUploader onFilesSelected={handleFilesSelected} />
            <div className="pt-2">
              <PresetSelector
                selectedPresetId={currentPresetId}
                onSelectPreset={setCurrentPresetId}
              />
            </div>
          </>
        )}

        {screen === 'analysis' && selectedFile && (
          <AnalysisScreen
            file={selectedFile}
            info={mediaInfo}
            plan={currentPlan}
            isAnalyzing={isAnalyzing}
            onOptimize={handleOptimize}
            onServerFallback={() => setShowConsentModal(true)}
            onCancel={resetAll}
          />
        )}

        {screen === 'processing' && (
          <ProcessingScreen
            ratio={progress?.ratio ?? 0}
            segmentIndex={progress?.segmentIndex ?? 1}
            segmentCount={progress?.segmentCount ?? 1}
            onCancel={handleCancelProcessing}
          />
        )}

        {screen === 'results' && (
          <ResultsScreen
            outputs={outputFiles}
            onReset={resetAll}
          />
        )}

        <ConsentModal
          isOpen={showConsentModal}
          onConfirm={handleConfirmServerFallback}
          onCancel={() => {
            setShowConsentModal(false);
            setScreen('analysis');
          }}
        />
      </main>

      <Footer />
    </div>
  );
};
export default App;
