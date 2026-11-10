/**
 * Bounded FIFO with a fixed number of concurrent workers. Keeps ffmpeg from saturating the
 * shared server: at most `concurrency` jobs run, at most `maxWaiting` wait, the rest get a 503.
 */
export class JobQueue {
  private running = 0;
  private readonly waiting: (() => Promise<void>)[] = [];

  constructor(
    private readonly concurrency: number,
    private readonly maxWaiting: number,
  ) {}

  get stats(): { running: number; waiting: number } {
    return { running: this.running, waiting: this.waiting.length };
  }

  /** Returns false (and does not enqueue) when the waiting list is full */
  push(task: () => Promise<void>): boolean {
    if (this.running >= this.concurrency && this.waiting.length >= this.maxWaiting) return false;
    this.waiting.push(task);
    this.drain();
    return true;
  }

  /** Removes a task that has not started yet */
  remove(task: () => Promise<void>): void {
    const i = this.waiting.indexOf(task);
    if (i >= 0) this.waiting.splice(i, 1);
  }

  private drain(): void {
    while (this.running < this.concurrency && this.waiting.length > 0) {
      const task = this.waiting.shift()!;
      this.running++;
      void task()
        .catch(() => undefined)
        .finally(() => {
          this.running--;
          this.drain();
        });
    }
  }
}
