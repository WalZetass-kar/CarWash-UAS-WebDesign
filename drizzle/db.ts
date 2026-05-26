import dns from "node:dns";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "@/drizzle/schema";
import { getConfiguredDatabaseUrl, getDatabaseEnvHint } from "@/lib/runtime/database-config";

dns.setDefaultResultOrder("ipv4first");

declare global {
  var cleanrideSql: postgres.Sql | undefined;
  var cleanrideSqlConnectionString: string | undefined;
}

export function hasDatabaseConfig() {
  return Boolean(getConfiguredDatabaseUrl());
}

export function isDemoModeEnabled() {
  return process.env.ENABLE_DEMO_MODE === "true";
}

export function shouldUseDemoData() {
  return !hasDatabaseConfig() && isDemoModeEnabled();
}

export function getDb() {
  const connectionString = getConfiguredDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      `${getDatabaseEnvHint()} wajib diatur. ENABLE_DEMO_MODE hanya boleh dipakai untuk pengujian internal lokal.`,
    );
  }

  if (!globalThis.cleanrideSql || globalThis.cleanrideSqlConnectionString !== connectionString) {
    globalThis.cleanrideSql = postgres(connectionString, {
      // Supabase pooler on local/student deployments is more reliable with one reused connection.
      max: 1,
      prepare: false,
      connect_timeout: 8,
      idle_timeout: 20,
      connection: {
        application_name: "cleanride-car-wash",
        statement_timeout: 15_000,
        lock_timeout: 5_000,
        idle_in_transaction_session_timeout: 15_000,
      },
    });
    globalThis.cleanrideSqlConnectionString = connectionString;
  }

  return drizzle(globalThis.cleanrideSql, { schema });
}

export async function resetDbConnection() {
  const sql = globalThis.cleanrideSql;
  globalThis.cleanrideSql = undefined;
  globalThis.cleanrideSqlConnectionString = undefined;
  await sql?.end({ timeout: 1 }).catch(() => undefined);
}
