import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "@/drizzle/schema";

const connectionString = process.env.DATABASE_URL;

declare global {
  var cleanrideSql: postgres.Sql | undefined;
}

export function hasDatabaseConfig() {
  return Boolean(connectionString);
}

export function getDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur. Isi .env.local dengan Supabase connection string.");
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
