export class ProcessingQueue {
  private active = 0;
  private pending: Array<() => void> = [];

  constructor(private readonly concurrency: number) {}

  get depth(): number {
    return this.pending.length;
  }

  get activeCount(): number {
    return this.active;
  }

  position(): number {
    return this.pending.length + 1;
  }

  add(task: () => Promise<void>): void {
    const run = (): void => {
      this.active += 1;
      void task().finally(() => {
        this.active -= 1;
        this.pending.shift()?.();
      });
    };
    if (this.active < this.concurrency) run();
    else this.pending.push(run);
  }
}
