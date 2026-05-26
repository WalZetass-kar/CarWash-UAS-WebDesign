import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const publicSupabaseKeyCandidates = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
];

const adminSupabaseKeyCandidates = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"];

const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "JWT_SECRET",
];

const databaseCandidates = ["DATABASE_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_URL"];

const missing = required.filter((name) => !process.env[name]?.trim());

if (!publicSupabaseKeyCandidates.some((name) => process.env[name]?.trim())) {
  missing.push(publicSupabaseKeyCandidates.join("/"));
}

if (!adminSupabaseKeyCandidates.some((name) => process.env[name]?.trim())) {
  missing.push(adminSupabaseKeyCandidates.join("/"));
}

if (!databaseCandidates.some((name) => process.env[name]?.trim())) {
  missing.push("DATABASE_URL/POSTGRES_URL_NON_POOLING/POSTGRES_URL");
}

if (missing.length > 0) {
  console.error(`Env wajib belum lengkap: ${missing.join(", ")}`);
  process.exit(1);
}

try {
  new URL(process.env.NEXT_PUBLIC_APP_URL);
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
} catch {
  console.error("NEXT_PUBLIC_APP_URL dan NEXT_PUBLIC_SUPABASE_URL harus berupa URL valid.");
  process.exit(1);
}

const databaseUrl = databaseCandidates.map((name) => process.env[name]?.trim()).find(Boolean);

if (!databaseUrl || !/^postgres(ql)?:\/\//.test(databaseUrl)) {
  console.error("Connection string database harus berupa URL Postgres yang valid.");
  process.exit(1);
}

if (process.env.JWT_SECRET.trim().length < 32) {
  console.error("JWT_SECRET minimal 32 karakter.");
  process.exit(1);
}

console.log("Konfigurasi env online valid.");
