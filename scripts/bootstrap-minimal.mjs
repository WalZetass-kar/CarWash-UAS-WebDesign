import nextEnv from "@next/env";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const supabaseUrl = getEnvValue([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_yesssss_SUPABASE_URL",
  "yesssss_SUPABASE_URL",
]);
const serviceRoleKey = getEnvValue([
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "yesssss_SUPABASE_SERVICE_ROLE_KEY",
  "yesssss_SUPABASE_SECRET_KEY",
]);

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Supabase URL dan service role key wajib diatur. Isi salah satu env berikut: NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_yesssss_SUPABASE_URL/yesssss_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY/yesssss_SUPABASE_SERVICE_ROLE_KEY/yesssss_SUPABASE_SECRET_KEY.",
  );
  process.exit(1);
}

const adminEmail = getArg("email", "admin@kilapkendaraan.my.id");
const adminName = getArg("name", "Admin Kilap Kendaraan");
const adminPassword = getArg("password", "admin123");
const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const nowIso = new Date().toISOString();

const [adminResult, settingsResult, packageUpsertResult, bucketResult] = await Promise.all([
  supabase.from("users").upsert(
    {
      id: "00000000-0000-4000-8000-000000000001",
      name: adminName,
      email: adminEmail,
      password_hash: adminPasswordHash,
      role: "admin",
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "email" },
  ),
  supabase.from("app_settings").upsert(
    {
      id: "default",
      business_name: "Kilap Kendaraan Car Wash",
      business_phone: "",
      business_address: "",
      queue_slot_capacity: 4,
      report_default_range_days: 30,
      auto_print_invoice: false,
      invoice_footer: "",
      created_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "id" },
  ),
  supabase.from("wash_packages").upsert(
    {
      id: "90000000-0000-4000-8000-000000000001",
      name: "Paket Standar",
      description: "Cuci eksterior, bilas, pengeringan, dan pengecekan ringan.",
      price: 35000,
      estimated_minutes: 30,
      image_url: null,
      is_active: true,
      created_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "id" },
  ),
  ensureBucket(supabase, "kilapkendaraan"),
]);

if (adminResult.error) {
  console.error("Gagal menanam admin bootstrap:", adminResult.error.message);
  process.exit(1);
}

if (settingsResult.error) {
  console.error("Gagal menanam settings bootstrap:", settingsResult.error.message);
  process.exit(1);
}

if (packageUpsertResult.error) {
  console.error("Gagal menanam paket bootstrap:", packageUpsertResult.error.message);
  process.exit(1);
}

if (bucketResult.error) {
  console.error("Gagal menyiapkan bucket gallery:", bucketResult.error.message);
  process.exit(1);
}

const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
const { count: settingsCount } = await supabase.from("app_settings").select("*", { count: "exact", head: true });
const { count: packageCount } = await supabase.from("wash_packages").select("*", { count: "exact", head: true });
const { data: buckets } = await supabase.storage.listBuckets();

console.log(
  JSON.stringify(
    {
      seeded: {
        users: userCount ?? 0,
        app_settings: settingsCount ?? 0,
        wash_packages: packageCount ?? 0,
        gallery_bucket: buckets?.some((bucket) => bucket.name === "kilapkendaraan") ?? false,
      },
      admin: {
        email: adminEmail,
        password: adminPassword,
      },
    },
    null,
    2,
  ),
);

async function ensureBucket(supabaseClient, bucketName) {
  const { data, error } = await supabaseClient.storage.listBuckets();
  if (error) {
    return { error };
  }

  if (data?.some((bucket) => bucket.name === bucketName)) {
    return { error: null };
  }

  const createResult = await supabaseClient.storage.createBucket(bucketName, {
    public: true,
  });

  if (createResult.error && !String(createResult.error.message).toLowerCase().includes("already exists")) {
    return createResult;
  }

  return { error: null };
}

function getArg(name, fallback) {
  const eqPrefix = `--${name}=`;
  const inline = process.argv.find((value) => value.startsWith(eqPrefix));
  if (inline) return inline.slice(eqPrefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1] && !process.argv[index + 1].startsWith("--")) {
    return process.argv[index + 1];
  }

  return fallback;
}

function getEnvValue(candidates) {
  for (const envName of candidates) {
    const value = process.env[envName]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}
