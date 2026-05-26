import { eq } from "drizzle-orm";
import { appSettings as appSettingsTable } from "@/drizzle/schema";
import { getDb, shouldUseDemoData } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { defaultAppSettings } from "@/lib/data";
import type { AppSettingsInput } from "@/schemas/settings";

export async function getAppSettings() {
  if (shouldUseDemoData()) {
    return getDemoState().settings;
  }

  const db = getDb();
  const existing = await db.query.appSettings.findFirst({
    where: eq(appSettingsTable.id, defaultAppSettings.id),
  });

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(appSettingsTable)
    .values(defaultAppSettings)
    .returning();

  return created;
}

export async function updateAppSettings(input: AppSettingsInput) {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.settings = {
      ...state.settings,
      ...input,
    };
    return state.settings;
  }

  const db = getDb();
  const [updated] = await db
    .insert(appSettingsTable)
    .values({
      ...defaultAppSettings,
      ...input,
    })
    .onConflictDoUpdate({
      target: appSettingsTable.id,
      set: {
        ...input,
        updatedAt: new Date(),
      },
    })
    .returning();

  return updated;
}
