/**
 * Loads the media engine on demand so the first paint of /app stays light
 * (PRD: initial JS < 150 KB gzip).
 */
export type Engine = typeof import('../engine');

let enginePromise: Promise<Engine> | null = null;

export function loadEngine(): Promise<Engine> {
  enginePromise ??= import('../engine');
  return enginePromise;
}
