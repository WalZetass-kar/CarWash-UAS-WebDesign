const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "JWT_SECRET",
];

const missing = required.filter((name) => !process.env[name]?.trim());

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

if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
  console.error("DATABASE_URL harus berupa connection string Postgres yang valid.");
  process.exit(1);
}

if (process.env.JWT_SECRET.trim().length < 32) {
  console.error("JWT_SECRET minimal 32 karakter.");
  process.exit(1);
}

console.log("Konfigurasi env online valid.");
