type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function scheduleCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
    if (buckets.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, 300_000);
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);

  scheduleCleanup();

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    ok: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
  };
}
