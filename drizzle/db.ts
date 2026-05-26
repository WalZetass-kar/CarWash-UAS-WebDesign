import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "@/drizzle/schema";

declare global {
  var cleanrideSql: postgres.Sql | undefined;
}

function getConnectionString() {
  return process.env.DATABASE_URL?.trim();
}

export function hasDatabaseConfig() {
  return Boolean(getConnectionString());
}

export function isDemoModeEnabled() {
  return process.env.ENABLE_DEMO_MODE === "true";
}

export function shouldUseDemoData() {
  return !hasDatabaseConfig() && isDemoModeEnabled();
}

export function getDb() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL wajib diatur. ENABLE_DEMO_MODE hanya boleh dipakai untuk pengujian internal lokal.",
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
