import { useSyncExternalStore } from 'react';

/**
 * PWA installation helper.
 *
 * Chrome, Edge and Android fire `beforeinstallprompt` once, often before React has mounted, so the
 * event is captured here at module load (imported first in main.tsx) and kept for later.
 * Safari (iOS, macOS) never fires it: installation goes through the Share menu instead.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallPlatform =
  | 'installed' // already running as an installed app
  | 'native' // the browser can show its own install dialog
  | 'ios-safari' // Share → Add to Home Screen
  | 'ios-other' // Chrome/Firefox on iOS: Share → Add to Home Screen (iOS 16.4+), or Safari
  | 'in-app' // WhatsApp, Instagram, Facebook… in-app browsers cannot install
  | 'android-menu' // Android browser without prompt yet: menu → Install app
  | 'desktop-menu'; // desktop browser without prompt: address bar or menu

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    notify();
  });
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    installed ||
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function detectInstallPlatform(ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''): InstallPlatform {
  if (isStandalone()) return 'installed';
  if (deferred) return 'native';
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|Twitter|LinkedInApp|GSA\//i.test(ua);
  if (inApp) return 'in-app';
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-other' : 'ios-safari';
  if (/Android/i.test(ua)) return 'android-menu';
  return 'desktop-menu';
}

/** Shows the browser's own install dialog. Resolves to true when the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const evt = deferred;
  deferred = null;
  await evt.prompt();
  const choice = await evt.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
  notify();
  return choice.outcome === 'accepted';
}

/** React hook: current install platform, updated when the browser becomes installable or the app is installed. */
export function useInstallPlatform(): InstallPlatform {
  return useSyncExternalStore(subscribeInstall, () => detectInstallPlatform(), () => 'desktop-menu');
}
