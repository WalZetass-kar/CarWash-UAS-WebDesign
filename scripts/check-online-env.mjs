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
];

const adminSupabaseKeyCandidates = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"];

const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "JWT_SECRET",
];

const databaseCandidates = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_DB_URL",
];

const missing = required.filter((name) => !process.env[name]?.trim());

if (!publicSupabaseKeyCandidates.some((name) => process.env[name]?.trim())) {
  missing.push(publicSupabaseKeyCandidates.join("/"));
}

if (!adminSupabaseKeyCandidates.some((name) => process.env[name]?.trim())) {
  missing.push(adminSupabaseKeyCandidates.join("/"));
}

if (!databaseCandidates.some((name) => process.env[name]?.trim())) {
  missing.push("DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING/SUPABASE_DB_URL");
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
