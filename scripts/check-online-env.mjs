import nextEnv from "@next/env";
import dns from "node:dns";
import postgres from "postgres";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");

const publicSupabaseKeyCandidates = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_yesssss_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_yesssss_SUPABASE_PUBLISHABLE_KEY",
  "yesssss_SUPABASE_ANON_KEY",
  "yesssss_SUPABASE_PUBLISHABLE_KEY",
];

const adminSupabaseKeyCandidates = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "yesssss_SUPABASE_SERVICE_ROLE_KEY",
  "yesssss_SUPABASE_SECRET_KEY",
];

const jwtSecretCandidates = ["JWT_SECRET", "SUPABASE_JWT_SECRET", "yesssss_SUPABASE_JWT_SECRET"];
const supabaseUrlCandidates = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_yesssss_SUPABASE_URL",
  "yesssss_SUPABASE_URL",
];

const databaseCandidates = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_DB_URL",
  "yesssss_DATABASE_URL",
  "yesssss_POSTGRES_URL",
  "yesssss_POSTGRES_PRISMA_URL",
  "yesssss_POSTGRES_URL_NON_POOLING",
  "yesssss_SUPABASE_DB_URL",
];

const missing = [];

if (!supabaseUrlCandidates.some((name) => process.env[name]?.trim())) {
  missing.push(supabaseUrlCandidates.join("/"));
}

if (!publicSupabaseKeyCandidates.some((name) => process.env[name]?.trim())) {
  missing.push(publicSupabaseKeyCandidates.join("/"));
}

if (!adminSupabaseKeyCandidates.some((name) => process.env[name]?.trim())) {
  missing.push(adminSupabaseKeyCandidates.join("/"));
}

if (!jwtSecretCandidates.some((name) => process.env[name]?.trim())) {
  missing.push(jwtSecretCandidates.join("/"));
}

if (!databaseCandidates.some((name) => process.env[name]?.trim())) {
  missing.push("DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING/SUPABASE_DB_URL/yesssss_*");
}

const appUrl = getAppUrl();
if (!appUrl) {
  missing.push("NEXT_PUBLIC_APP_URL/VERCEL_PROJECT_PRODUCTION_URL/VERCEL_URL");
}

if (missing.length > 0) {
  console.error(`Env wajib belum lengkap: ${missing.join(", ")}`);
  process.exit(1);
}

try {
  new URL(appUrl);
  const supabaseUrl = supabaseUrlCandidates.map((name) => process.env[name]?.trim()).find(Boolean);
  if (!supabaseUrl) {
    throw new Error("Supabase URL kosong");
  }
  new URL(supabaseUrl);
} catch {
  console.error("NEXT_PUBLIC_APP_URL dan Supabase URL harus berupa URL valid.");
  process.exit(1);
}

const databaseUrl = databaseCandidates.map((name) => process.env[name]?.trim()).find(Boolean);

if (!databaseUrl || !/^postgres(ql)?:\/\//.test(databaseUrl)) {
  console.error("Connection string database harus berupa URL Postgres yang valid.");
  process.exit(1);
}

const jwtSecret = jwtSecretCandidates.map((name) => process.env[name]?.trim()).find(Boolean);
if (!jwtSecret || jwtSecret.length < 32) {
  console.error(`JWT secret minimal 32 karakter. Isi salah satu env berikut: ${jwtSecretCandidates.join(", ")}`);
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  connect_timeout: 8,
  idle_timeout: 5,
});

try {
  await sql`select 1 as ok`;
  const requiredTables = [
    "users",
    "customers",
    "wash_packages",
    "queues",
    "transactions",
    "payments",
    "app_settings",
    "activity_logs",
  ];
  const rows = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any(${requiredTables})
  `;
  const present = new Set(rows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((name) => !present.has(name));
  if (missingTables.length > 0) {
    console.error(`Database terhubung, tapi tabel wajib belum lengkap: ${missingTables.join(", ")}.`);
    console.error("Jalankan npm run db:push atau scripts/supabase-bootstrap.sql sebelum deploy.");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("Koneksi database gagal. Periksa POSTGRES/DATABASE_URL, pooler Supabase, SSL, dan password.");
  const detail = describeError(error);
  if (detail) console.error(detail);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 1 }).catch(() => undefined);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Konfigurasi env online valid.");

function describeError(error) {
  if (!error || typeof error !== "object") return String(error);

  const parts = [];
  if ("code" in error && error.code) parts.push(`code=${error.code}`);
  if (error instanceof Error && error.message) parts.push(error.message);
  if ("cause" in error && error.cause instanceof Error && error.cause.message) {
    parts.push(error.cause.message);
  }
  return parts.join(" | ");
}

function getAppUrl() {
  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (rawAppUrl) return rawAppUrl;

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionUrl) return normalizeAppUrl(vercelProductionUrl);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return normalizeAppUrl(vercelUrl);

  return undefined;
}

function normalizeAppUrl(rawUrl) {
  return rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;
}
