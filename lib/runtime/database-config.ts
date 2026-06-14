export const DATABASE_ENV_CANDIDATES = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_DB_URL",
] as const;

export function getConfiguredDatabaseUrl() {
  for (const envName of DATABASE_ENV_CANDIDATES) {
    const value = process.env[envName]?.trim();
    if (value) {
      return ensurePoolerParams(value);
    }
  }

  return undefined;
}

function ensurePoolerParams(url: string) {
  if (!url.includes("pooler.supabase.com")) return url;
  if (url.includes("pgbouncer=true")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}pgbouncer=true`;
}

export function getDatabaseEnvHint() {
  return DATABASE_ENV_CANDIDATES.join(", ");
}
