import { SafeError } from "../types/api.js";

type Bucket = {
  count: number;
  resetAt: number;
};

export class MemoryRateLimit {
  private readonly buckets = new Map<string, Bucket>();

  public constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  public assertAllowed(key: string): void {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }
    bucket.count += 1;
    if (bucket.count > this.max) {
      throw new SafeError("RATE_LIMITED", "Too many requests. Try again later.", 429);
    }
  }
}
