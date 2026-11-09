import * as Comlink from 'comlink';
import { probe, plan, run, detectCapabilities } from '@whatmedia/core';
import type { MediaInfo, Plan, OutputFile, Progress, Capabilities } from '@whatmedia/core';
import type { PresetId } from '@whatmedia/config';

export interface WorkerAPI {
  getCapabilities(): Promise<Capabilities>;
  probeFile(file: File): Promise<MediaInfo>;
  generatePlan(info: MediaInfo, presetId: PresetId, overrides?: { segmentDurationSec?: number }): Promise<Plan>;
  processMedia(
    file: File,
    plan: Plan,
    onProgress: (p: Progress) => void,
  ): Promise<OutputFile[]>;
}

const api: WorkerAPI = {
  async getCapabilities() {
    return detectCapabilities();
  },

  async probeFile(file: File) {
    return probe(file);
  },

  async generatePlan(info: MediaInfo, presetId: PresetId, overrides?: { segmentDurationSec?: number }) {
    const caps = await detectCapabilities();
    return plan(info, presetId, caps, overrides);
  },

  async processMedia(file: File, plan: Plan, onProgress: (p: Progress) => void) {
    return run(file, plan, {
      onProgress: (p) => {
        onProgress(p);
      },
    });
  },
};

Comlink.expose(api);
