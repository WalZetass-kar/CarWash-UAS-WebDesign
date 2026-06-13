import { eq } from "drizzle-orm";
import {
  activityLogs,
  appSettings as appSettingsTable,
  customers,
  gallery,
  payments,
  queues,
  transactions,
} from "@/drizzle/schema";
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

export async function resetOperationalData() {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    const counts = {
      payments: state.payments.length,
      transactions: state.transactions.length,
      queues: state.queues.length,
      customers: state.customers.length,
      activityLogs: state.activityLogs.length,
      gallery: state.galleryUrls.length,
    };
    state.payments = [];
    state.transactions = [];
    state.queues = [];
    state.customers = [];
    state.activityLogs = [];
    state.galleryUrls = [];
    return counts;
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const p = await tx.delete(payments).returning({ id: payments.id });
    const t = await tx.delete(transactions).returning({ id: transactions.id });
    const q = await tx.delete(queues).returning({ id: queues.id });
    const c = await tx.delete(customers).returning({ id: customers.id });
    const a = await tx.delete(activityLogs).returning({ id: activityLogs.id });
    const g = await tx.delete(gallery).returning({ id: gallery.id });
    return {
      payments: p.length,
      transactions: t.length,
      queues: q.length,
      customers: c.length,
      activityLogs: a.length,
      gallery: g.length,
    };
  });

  return result;
}
