export const DATABASE_ENV_CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

export function getConfiguredDatabaseUrl() {
  for (const envName of DATABASE_ENV_CANDIDATES) {
    const value = process.env[envName]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getDatabaseEnvHint() {
  return DATABASE_ENV_CANDIDATES.join(", ");
}
