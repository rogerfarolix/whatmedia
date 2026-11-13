import { useSyncExternalStore } from 'react';

/**
 * Keeps installed copies of the app up to date.
 *
 * The service worker downloads and activates a new version by itself (skipWaiting + clientsClaim),
 * but the page already on screen keeps running the old code. Here we notice the change of
 * controller and expose `updateReady`; App reloads once the user is back on the home screen, so a
 * file being processed or shared is never interrupted. We also ask the browser to look for a new
 * version whenever the app comes back to the foreground, which matters on iPhone where an
 * installed app often stays in memory for days.
 */
let updateReady = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const CHECK_EVERY_MS = 30 * 60 * 1000;

export function startUpdateWatcher(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  // The very first claim of a fresh install is not an update.
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    updateReady = true;
    notify();
  });

  const check = () => {
    void navigator.serviceWorker.getRegistration('/app/').then((reg) => reg?.update().catch(() => undefined));
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  window.setInterval(check, CHECK_EVERY_MS);
  check();
}

export function useUpdateReady(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => updateReady,
    () => false,
  );
}
