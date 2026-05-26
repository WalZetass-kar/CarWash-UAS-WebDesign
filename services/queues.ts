import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { customers, queues, transactions, washPackages } from "@/drizzle/schema";
import { getDb, shouldUseDemoData } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { type QueueItem } from "@/lib/data";
import { getHourKey } from "@/lib/utils";
import type { QueueInput, QueueStatusInput } from "@/schemas/queue";
import { getAppSettings } from "@/services/settings";
import { createMemoryTransaction } from "@/services/transactions";

function nextQueueNumber(count: number) {
  return `CR-${String(count + 1).padStart(3, "0")}`;
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function listQueues(query = "", status?: string | null) {
  if (shouldUseDemoData()) {
    const { queues: memoryQueues } = getDemoState();
    const normalized = query.toLowerCase();
    return memoryQueues.filter((item) => {
      const matchesQuery = [item.queueNumber, item.customerName, item.packageName, item.licensePlate]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      const matchesStatus = status ? item.status === status : true;
      return matchesQuery && matchesStatus;
    });
  }

  const statusFilter =
    status && ["menunggu", "diproses", "selesai", "dibatalkan"].includes(status)
      ? eq(queues.status, status as QueueStatusInput["status"])
      : undefined;
  const searchFilter = query
    ? or(
        ilike(queues.queueNumber, `%${query}%`),
        ilike(customers.name, `%${query}%`),
        ilike(customers.licensePlate, `%${query}%`),
        ilike(washPackages.name, `%${query}%`),
      )
    : undefined;

  return getDb()
    .select({
      id: queues.id,
      queueNumber: queues.queueNumber,
      customerId: queues.customerId,
      packageId: queues.packageId,
      customerName: customers.name,
      packageName: washPackages.name,
      licensePlate: customers.licensePlate,
      scheduledAt: queues.scheduledAt,
      status: queues.status,
      total: washPackages.price,
      createdAt: queues.createdAt,
    })
    .from(queues)
    .innerJoin(customers, eq(queues.customerId, customers.id))
    .innerJoin(washPackages, eq(queues.packageId, washPackages.id))
    .where(and(isNull(queues.deletedAt), statusFilter, searchFilter))
    .orderBy(desc(queues.createdAt));
}

export async function createQueue(input: QueueInput, createdBy?: string) {
  const settings = await getAppSettings();
  const requestedHourKey = getHourKey(input.scheduledAt);
  if (!requestedHourKey) {
    throw new Error("Jadwal antrian tidak valid.");
  }

  if (shouldUseDemoData()) {
    const state = getDemoState();
    const memoryQueues = state.queues;
    const queuesInSlot = memoryQueues.filter(
      (item) => item.status !== "dibatalkan" && getHourKey(item.scheduledAt) === requestedHourKey,
    );
    if (queuesInSlot.length >= settings.queueSlotCapacity) {
      throw new Error("Slot jadwal pada jam tersebut sudah penuh.");
    }

    const customer = state.customers.find((item) => item.id === input.customerId);
    if (!customer) {
      throw new Error("Pelanggan tidak ditemukan.");
    }

    const washPackage = state.packages.find((item) => item.id === input.packageId && item.isActive);
    if (!washPackage) {
      throw new Error("Paket tidak ditemukan atau tidak aktif.");
    }

    const queue: QueueItem = {
      id: crypto.randomUUID(),
      queueNumber: nextQueueNumber(memoryQueues.length),
      customerId: customer.id,
      packageId: washPackage.id,
      customerName: customer.name,
      packageName: washPackage.name,
      licensePlate: customer.licensePlate,
      scheduledAt: input.scheduledAt.toISOString(),
      status: input.status,
      total: washPackage.price,
      createdAt: new Date().toISOString(),
    };
    state.queues = [queue, ...memoryQueues];
    createMemoryTransaction({
      id: crypto.randomUUID(),
      queueId: queue.id,
      queueNumber: queue.queueNumber,
      customerId: customer.id,
      customerName: customer.name,
      packageId: washPackage.id,
      packageName: washPackage.name,
      total: washPackage.price,
      status: "belum_bayar",
      createdAt: queue.createdAt,
    });
    return queue;
  }

  const db = getDb();
  const existingQueues = await db
    .select({
      scheduledAt: queues.scheduledAt,
      status: queues.status,
    })
    .from(queues)
    .where(isNull(queues.deletedAt));
  const queuesInSlot = existingQueues.filter(
    (item) => item.status !== "dibatalkan" && getHourKey(item.scheduledAt) === requestedHourKey,
  );
  if (queuesInSlot.length >= settings.queueSlotCapacity) {
    throw new Error("Slot jadwal pada jam tersebut sudah penuh.");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.transaction(async (tx) => {
        const [washPackage] = await tx
          .select()
          .from(washPackages)
          .where(
            and(
              eq(washPackages.id, input.packageId),
              eq(washPackages.isActive, true),
              isNull(washPackages.deletedAt),
            ),
          );
        if (!washPackage) throw new Error("Paket tidak ditemukan atau tidak aktif.");

        const [numberRow] = await tx
          .select({
            nextNumber: sql<number>`coalesce(max((regexp_replace(${queues.queueNumber}, '[^0-9]', '', 'g'))::integer), 0) + 1`,
          })
          .from(queues);
        const queueNumber = nextQueueNumber(Number(numberRow?.nextNumber ?? 1) - 1);
        const [created] = await tx
          .insert(queues)
          .values({
            queueNumber,
            customerId: input.customerId,
            packageId: input.packageId,
            scheduledAt: input.scheduledAt,
            status: input.status,
            notes: input.notes,
          })
          .returning();

        await tx.insert(transactions).values({
          queueId: created.id,
          customerId: input.customerId,
          packageId: input.packageId,
          subtotal: washPackage.price,
          discount: 0,
          total: washPackage.price,
          status: "belum_bayar",
          createdBy,
        });

        return created;
      });
    } catch (error) {
      if (attempt < 2 && isUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw new Error("Gagal membuat nomor antrian.");
}

export async function updateQueueStatus(id: string, input: QueueStatusInput) {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.queues = state.queues.map((item) =>
      item.id === id ? { ...item, status: input.status } : item,
    );
    return state.queues.find((item) => item.id === id) ?? null;
  }

  const [updated] = await getDb()
    .update(queues)
    .set({ status: input.status, updatedAt: new Date() })
    .where(and(eq(queues.id, id), isNull(queues.deletedAt)))
    .returning();
  return updated ?? null;
}

export async function deleteQueue(id: string) {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.queues = state.queues.filter((item) => item.id !== id);
    return true;
  }

  await getDb()
    .update(queues)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(queues.id, id));
  return true;
}
