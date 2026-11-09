export * from './types.js';
export { plan, type PlanOverrides } from './plan.js';
export { detectCapabilities } from './capabilities.js';
export { probe } from './probe.js';
export { runWebCodecs, type RunOptions } from './engines/webcodecs.js';
export { presets, whatsappLimits } from '@whatmedia/config';

import type { Plan, OutputFile } from './types.js';
import { runWebCodecs, type RunOptions } from './engines/webcodecs.js';

/**
 * Universal runner that dispatches to the planned engine (webcodecs, etc.)
 */
export async function run(
  file: File | Blob,
  plan: Plan,
  options?: RunOptions,
): Promise<OutputFile[]> {
  if (plan.engine === 'webcodecs') {
    return runWebCodecs(file, plan, options);
  }

  // Fallback to webcodecs as primary engine for local processing
  return runWebCodecs(file, plan, options);
}
