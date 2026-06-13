import { resetDbConnection } from "@/drizzle/db";

const TRANSIENT_DATABASE_CODES = new Set([
  "CONNECTION_DESTROYED",
  "CONNECT_TIMEOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
]);

export async function withDatabaseRetry<T>(operation: () => Promise<T>, attempts = 4) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt === attempts - 1) {
        throw error;
      }

      await resetDbConnection();
      await delay(350 * (attempt + 1));
    }
  }

  throw lastError;
}

function isTransientDatabaseError(error: unknown) {
  return collectErrorCodes(error).some((code) => TRANSIENT_DATABASE_CODES.has(code));
}

function collectErrorCodes(error: unknown) {
  const codes: string[] = [];
  const seen = new Set<unknown>();
  let current = error;

  while (typeof current === "object" && current !== null && !seen.has(current)) {
    seen.add(current);
    const record = current as { code?: unknown; cause?: unknown; errors?: unknown };
    if (typeof record.code === "string") codes.push(record.code);
    if (Array.isArray(record.errors)) {
      for (const child of record.errors) {
        codes.push(...collectErrorCodes(child));
      }
    }
    current = record.cause;
  }

  return codes;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
