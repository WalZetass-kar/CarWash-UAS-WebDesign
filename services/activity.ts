import { activityLogs } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";

export async function logActivity(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  if (!hasDatabaseConfig()) return;

  try {
    await getDb().insert(activityLogs).values({
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  } catch (error) {
    console.error("Gagal menyimpan activity log", error);
  }
}
