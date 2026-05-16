import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { customers, queues, transactions, washPackages } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import { demoQueues, demoPackages, demoCustomers, type QueueItem } from "@/lib/data";
import type { QueueInput, QueueStatusInput } from "@/schemas/queue";

let memoryQueues: QueueItem[] = [...demoQueues];

function nextQueueNumber(count: number) {
  return `CR-${String(count + 1).padStart(3, "0")}`;
}

export async function listQueues(query = "", status?: string | null) {
  if (!hasDatabaseConfig()) {
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
  if (!hasDatabaseConfig()) {
    const customer = demoCustomers.find((item) => item.id === input.customerId) ?? demoCustomers[0];
    const washPackage = demoPackages.find((item) => item.id === input.packageId) ?? demoPackages[0];
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
    memoryQueues = [queue, ...memoryQueues];
    return queue;
  }

  const db = getDb();
  const [washPackage] = await db
    .select()
    .from(washPackages)
    .where(and(eq(washPackages.id, input.packageId), isNull(washPackages.deletedAt)));
  if (!washPackage) throw new Error("Paket tidak ditemukan.");

  const countRows = await db.select({ id: queues.id }).from(queues);
  const [created] = await db
    .insert(queues)
    .values({
      queueNumber: nextQueueNumber(countRows.length),
      customerId: input.customerId,
      packageId: input.packageId,
      scheduledAt: input.scheduledAt,
      status: input.status,
      notes: input.notes,
    })
    .returning();

  await db.insert(transactions).values({
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
}

export async function updateQueueStatus(id: string, input: QueueStatusInput) {
  if (!hasDatabaseConfig()) {
    memoryQueues = memoryQueues.map((item) =>
      item.id === id ? { ...item, status: input.status } : item,
    );
    return memoryQueues.find((item) => item.id === id) ?? null;
  }

  const [updated] = await getDb()
    .update(queues)
    .set({ status: input.status, updatedAt: new Date() })
    .where(and(eq(queues.id, id), isNull(queues.deletedAt)))
    .returning();
  return updated ?? null;
}

export async function deleteQueue(id: string) {
  if (!hasDatabaseConfig()) {
    memoryQueues = memoryQueues.filter((item) => item.id !== id);
    return true;
  }

  await getDb()
    .update(queues)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(queues.id, id));
  return true;
}
