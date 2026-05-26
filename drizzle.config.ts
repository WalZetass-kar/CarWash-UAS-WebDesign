import nextEnv from "@next/env";
import { defineConfig } from "drizzle-kit";
import { getConfiguredDatabaseUrl } from "./lib/runtime/database-config";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getConfiguredDatabaseUrl() ?? "",
  },
  verbose: true,
  strict: true,
});
