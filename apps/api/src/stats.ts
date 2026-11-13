import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Anonymous usage counter: daily totals only. No identifier, no IP address, no file name and
 * no timestamp finer than the day is ever stored. Counts actions (files prepared), not people.
 */
export type StatKind = 'video' | 'photo';

interface DayTotals {
  videos: number;
  photos: number;
  parts: number;
}

interface StatsFile {
  since: string;
  days: Record<string, DayTotals>;
}

export interface PublicStats {
  since: string;
  /** False while totals are below the publication threshold: clients then hide the numbers */
  public: boolean;
  threshold: number;
  totals: { files: number; videos: number; photos: number; parts: number };
  months: { month: string; files: number; parts: number }[];
}

const day = (d = new Date()) => d.toISOString().slice(0, 10);

export class StatsStore {
  private data: StatsFile;
  private dirty = false;
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly file: string,
    private readonly threshold: number,
  ) {
    this.data = { since: day(), days: {} };
    try {
      if (existsSync(file)) {
        const parsed = JSON.parse(readFileSync(file, 'utf8')) as StatsFile;
        if (parsed && typeof parsed.since === 'string' && parsed.days) this.data = parsed;
      }
    } catch {
      // Corrupt or unreadable file: start again rather than crash
    }
  }

  record(kind: StatKind, parts: number): void {
    const key = day();
    const t = (this.data.days[key] ??= { videos: 0, photos: 0, parts: 0 });
    if (kind === 'video') t.videos++;
    else t.photos++;
    t.parts += parts;
    this.dirty = true;
    this.timer ??= setTimeout(() => this.flush(), 5000);
    this.timer.unref?.();
  }

  /** Atomic write (temp file + rename) so a crash never leaves a half-written file. */
  flush(): void {
    this.timer = undefined;
    if (!this.dirty) return;
    try {
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      writeFileSync(tmp, JSON.stringify(this.data));
      renameSync(tmp, this.file);
      this.dirty = false;
    } catch {
      // Read-only or missing volume: keep counting in memory
    }
  }

  summary(): PublicStats {
    const totals = { files: 0, videos: 0, photos: 0, parts: 0 };
    const months = new Map<string, { files: number; parts: number }>();
    for (const [d, t] of Object.entries(this.data.days)) {
      totals.videos += t.videos;
      totals.photos += t.photos;
      totals.parts += t.parts;
      const m = months.get(d.slice(0, 7)) ?? { files: 0, parts: 0 };
      m.files += t.videos + t.photos;
      m.parts += t.parts;
      months.set(d.slice(0, 7), m);
    }
    totals.files = totals.videos + totals.photos;
    return {
      since: this.data.since,
      public: totals.files >= this.threshold,
      threshold: this.threshold,
      totals,
      months: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v })),
    };
  }
}
