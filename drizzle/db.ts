import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "@/drizzle/schema";
import { getConfiguredDatabaseUrl, getDatabaseEnvHint } from "@/lib/runtime/database-config";

declare global {
  var cleanrideSql: postgres.Sql | undefined;
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

  const sql =
    globalThis.cleanrideSql ??
    postgres(connectionString, {
      max: 5,
      prepare: false,
      idle_timeout: 20,
    });

  if (process.env.NODE_ENV !== "production") {
    globalThis.cleanrideSql = sql;
  }

  return drizzle(sql, { schema });
}
