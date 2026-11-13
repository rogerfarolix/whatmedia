import { API_BASE } from './serverClient';

/**
 * Anonymous usage counter. After a file is prepared, the app sends only
 * `{ kind: 'video' | 'photo', parts }`: no file, no name, no size, no identifier, no cookie.
 * The server keeps daily totals and does not log these requests. Users can opt out.
 */
const OPT_OUT_KEY = 'whatmedia:stats-optout';

export function isUsageCountingEnabled(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) !== '1';
  } catch {
    return true;
  }
}

export function setUsageCountingEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.removeItem(OPT_OUT_KEY);
    else localStorage.setItem(OPT_OUT_KEY, '1');
  } catch {
    // Storage blocked: nothing to remember
  }
}

export function reportUsage(kind: 'video' | 'photo', parts: number): void {
  if (!isUsageCountingEnabled() || parts < 1) return;
  try {
    void fetch(`${API_BASE}/stats/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, parts: Math.min(60, Math.round(parts)) }),
      credentials: 'omit',
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {});
  } catch {
    // Counting must never affect the app
  }
}

/** Kind of a processed file, from its outputs */
export function kindOf(outputs: { file: File }[]): 'video' | 'photo' {
  return outputs[0]?.file.type.startsWith('image/') ? 'photo' : 'video';
}
