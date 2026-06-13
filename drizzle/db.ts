import dns from "node:dns";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "@/drizzle/schema";
import { getConfiguredDatabaseUrl, getDatabaseEnvHint } from "@/lib/runtime/database-config";

dns.setDefaultResultOrder("ipv4first");

declare global {
  var kilapkendaraanSql: postgres.Sql | undefined;
  var kilapkendaraanSqlConnectionString: string | undefined;
}

export function hasDatabaseConfig() {
  return Boolean(getConfiguredDatabaseUrl());
}

export function isDemoModeEnabled() {
  return process.env.ENABLE_DEMO_MODE === "true";
}

export function shouldUseDemoData() {
  return isDemoModeEnabled();
}

export function getDb() {
  const connectionString = getConfiguredDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      `${getDatabaseEnvHint()} wajib diatur. ENABLE_DEMO_MODE hanya boleh dipakai untuk pengujian internal lokal.`,
    );
  }

  if (!globalThis.kilapkendaraanSql || globalThis.kilapkendaraanSqlConnectionString !== connectionString) {
    globalThis.kilapkendaraanSql = postgres(connectionString, {
      // Supabase pooler on local/student deployments is more reliable with one reused connection.
      max: 1,
      prepare: false,
      connect_timeout: 10,
      idle_timeout: 15,
      connection: {
        application_name: "kilapkendaraan-car-wash",
        statement_timeout: 15_000,
        lock_timeout: 5_000,
        idle_in_transaction_session_timeout: 15_000,
      },
    });
    globalThis.kilapkendaraanSqlConnectionString = connectionString;
  }

  return drizzle(globalThis.kilapkendaraanSql, { schema });
}

export async function resetDbConnection() {
  const sql = globalThis.kilapkendaraanSql;
  globalThis.kilapkendaraanSql = undefined;
  globalThis.kilapkendaraanSqlConnectionString = undefined;
  await sql?.end({ timeout: 1 }).catch(() => undefined);
}
