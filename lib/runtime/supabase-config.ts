const PUBLIC_SUPABASE_KEY_CANDIDATES = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
] as const;

const SERVICE_SUPABASE_KEY_CANDIDATES = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

function getEnvValue(candidates: readonly string[]) {
  for (const envName of candidates) {
    const value = process.env[envName]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

export function getSupabaseBrowserKey() {
  return getEnvValue(PUBLIC_SUPABASE_KEY_CANDIDATES);
}

export function getSupabaseAdminKey() {
  return getEnvValue(SERVICE_SUPABASE_KEY_CANDIDATES);
}

export function getSupabaseBrowserKeyHint() {
  return PUBLIC_SUPABASE_KEY_CANDIDATES.join(", ");
}

export function getSupabaseAdminKeyHint() {
  return SERVICE_SUPABASE_KEY_CANDIDATES.join(", ");
}
