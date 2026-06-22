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

export function isTestEnvironment() {
  return process.env.NODE_ENV === "test";
}

export function shouldUseTestFixtures() {
  return isTestEnvironment() || isDemoFixtureModeEnabled();
}

export function isDemoFixtureModeEnabled() {
  const value = process.env.KILAPKENDARAAN_USE_DEMO_FIXTURES?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function getDb() {
  const connectionString = getConfiguredDatabaseUrl();
  if (!connectionString) {
    throw new Error(`${getDatabaseEnvHint()} wajib diatur.`);
  }

  if (!globalThis.kilapkendaraanSql || globalThis.kilapkendaraanSqlConnectionString !== connectionString) {
    globalThis.kilapkendaraanSql = postgres(connectionString, {
      // Supabase pooler on local/student deployments is more reliable with one reused connection.
      max: 1,
      prepare: false,
      connect_timeout: 15,
      idle_timeout: 30,
      connection: {
        application_name: "kilapkendaraan-car-wash",
        statement_timeout: 30_000,
        lock_timeout: 10_000,
        idle_in_transaction_session_timeout: 30_000,
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
