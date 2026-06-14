import { desc, eq } from "drizzle-orm";
import { activityLogs, users } from "@/drizzle/schema";
import { getDb, shouldUseTestFixtures } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { type ActivityFeedItem } from "@/lib/data";

type ActivityInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logActivity(input: ActivityInput) {
  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    state.activityLogs = [
      {
        id: crypto.randomUUID(),
        ...input,
        entityId: input.entityId ?? null,
        userId: input.userId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        createdAt: new Date().toISOString(),
      },
      ...state.activityLogs,
    ].slice(0, 50);
    return;
  }

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

export async function listRecentActivity(limit = 5): Promise<ActivityFeedItem[]> {
  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    return state.activityLogs.slice(0, limit).map((item) => ({
      id: item.id,
      message: buildActivityMessage({
        actorName: state.users.find((user) => user.id === item.userId)?.name,
        action: item.action,
        entity: item.entity,
      }),
      createdAt: item.createdAt,
    }));
  }

  try {
    const rows = await getDb()
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entity: activityLogs.entity,
        createdAt: activityLogs.createdAt,
        actorName: users.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    return rows.map((item) => ({
      id: item.id,
      message: buildActivityMessage(item),
      createdAt: item.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to list recent activity", error);
    return [];
  }
}

function buildActivityMessage(input: {
  actorName?: string | null;
  action: string;
  entity: string;
}) {
  const actor = input.actorName ?? "Sistem";
  const actionMap: Record<string, string> = {
    create: "menambahkan",
    update: "memperbarui",
    update_status: "mengubah status",
    deactivate: "menonaktifkan",
    delete: "menghapus",
    payment: "mencatat pembayaran",
    login: "login ke dashboard",
    logout: "logout dari dashboard",
    reset_password: "mereset password",
    seed: "menyiapkan data awal",
  };
  const entityMap: Record<string, string> = {
    auth: "autentikasi",
    customers: "pelanggan",
    database: "database",
    payments: "pembayaran",
    queues: "antrian",
    settings: "pengaturan sistem",
    users: "user",
    wash_packages: "paket pencucian",
  };

  const action = actionMap[input.action] ?? input.action;
  const entity = entityMap[input.entity] ?? input.entity;

  return `${actor} ${action} ${entity}`;
}
