export * from './types.js';
export { plan, type PlanOverrides } from './plan.js';
export { detectCapabilities } from './capabilities.js';
export { probe } from './probe.js';
export { runWebCodecs, type RunOptions } from './engines/webcodecs.js';
export { runImageOptimization } from './image.js';
export { presets, whatsappLimits } from '@whatmedia/config';

import type { Plan, OutputFile } from './types.js';
import { runWebCodecs, type RunOptions } from './engines/webcodecs.js';
import { runImageOptimization } from './image.js';

/**
 * Universal runner that dispatches to the planned engine (webcodecs for video, canvas for images)
 */
export async function run(
  file: File | Blob,
  plan: Plan,
  options?: RunOptions,
): Promise<OutputFile[]> {
  const isImage = file.type.startsWith('image/') || !!plan.image;

  if (isImage) {
    return runImageOptimization(file, plan, options?.onProgress);
  }

  return runWebCodecs(file, plan, options);
}
