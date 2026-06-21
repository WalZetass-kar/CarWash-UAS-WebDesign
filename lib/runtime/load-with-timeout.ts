type TimeoutFallbackOptions<T> = {
  fallback: () => T;
  label: string;
  timeoutMs: number;
};

export async function loadWithTimeoutFallback<T>(
  operation: () => Promise<T>,
  options: TimeoutFallbackOptions<T>,
): Promise<T> {
  const { fallback, label, timeoutMs } = options;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
          if (process.env.NODE_ENV !== "test") {
            console.warn(`Timed out loading ${label} after ${timeoutMs}ms; using fallback.`);
          }
          resolve(fallback());
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    console.error(`Failed to load ${label}`, error);
    return fallback();
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
