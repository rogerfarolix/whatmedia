import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release(): Promise<void>;
  released?: boolean;
}

/**
 * Keeps the screen awake while `active` is true (Screen Wake Lock API, iOS 16.4+, Chrome 84+).
 * iOS suspends JavaScript when the screen locks, which would interrupt local processing.
 * The lock is dropped by the browser when the page is hidden, so it is re-acquired on return.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;
    const wakeLock = (navigator as Navigator & {
      wakeLock: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
    }).wakeLock;

    const acquire = async () => {
      try {
        const s = await wakeLock.request('screen');
        if (cancelled) await s.release();
        else sentinel = s;
      } catch {
        // Denied (low battery, unsupported context): processing continues without it.
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => {});
    };
  }, [active]);
}
