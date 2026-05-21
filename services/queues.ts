import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { customers, queues, transactions, washPackages } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import type { QueueItem, TransactionItem } from "@/lib/data";
import { demoStore } from "@/lib/demo-store";
import { queueStatuses } from "@/lib/constants";
import type { QueueInput, QueueStatusInput } from "@/schemas/queue";

function nextQueueNumber(count: number) {
  return `CR-${String(count + 1).padStart(3, "0")}`;
}

async function getQueueById(id: string) {
  if (!hasDatabaseConfig()) {
    return demoStore.queues.find((item) => item.id === id) ?? null;
  }

  const [queue] = await getDb()
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
    .where(and(eq(queues.id, id), isNull(queues.deletedAt)));

  return queue ?? null;
}

export async function listQueues(query = "", status?: string | null) {
  if (!hasDatabaseConfig()) {
    const normalized = query.toLowerCase();
    return demoStore.queues.filter((item) => {
      const matchesQuery = [item.queueNumber, item.customerName, item.packageName, item.licensePlate]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      const matchesStatus = status ? item.status === status : true;
      return matchesQuery && matchesStatus;
    });
  }

  const statusFilter =
    status && queueStatuses.includes(status as (typeof queueStatuses)[number])
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
    const customer = demoStore.customers.find((item) => item.id === input.customerId) ?? demoStore.customers[0];
    const washPackage = demoStore.packages.find((item) => item.id === input.packageId) ?? demoStore.packages[0];
    const queue: QueueItem = {
      id: crypto.randomUUID(),
      queueNumber: nextQueueNumber(demoStore.queues.length),
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
    const transaction: TransactionItem = {
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
    };
    demoStore.queues = [queue, ...demoStore.queues];
    demoStore.transactions = [transaction, ...demoStore.transactions];
    return queue;
  }

  const db = getDb();
  const [washPackage] = await db
    .select()
    .from(washPackages)
    .where(and(eq(washPackages.id, input.packageId), isNull(washPackages.deletedAt)));
  if (!washPackage) throw new Error("Paket tidak ditemukan.");

  const countRows = await db.select({ id: queues.id }).from(queues).where(isNull(queues.deletedAt));
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

  return (await getQueueById(created.id)) ?? created;
}

export async function updateQueueStatus(id: string, input: QueueStatusInput) {
  if (!hasDatabaseConfig()) {
    demoStore.queues = demoStore.queues.map((item) =>
      item.id === id ? { ...item, status: input.status } : item,
    );
    return demoStore.queues.find((item) => item.id === id) ?? null;
  }

  const [updated] = await getDb()
    .update(queues)
    .set({ status: input.status, updatedAt: new Date() })
    .where(and(eq(queues.id, id), isNull(queues.deletedAt)))
    .returning();
  return updated ? await getQueueById(id) : null;
}

export async function deleteQueue(id: string) {
  if (!hasDatabaseConfig()) {
    const transactionIds = demoStore.transactions
      .filter((item) => item.queueId === id)
      .map((item) => item.id);
    demoStore.queues = demoStore.queues.filter((item) => item.id !== id);
    demoStore.transactions = demoStore.transactions.filter((item) => item.queueId !== id);
    demoStore.payments = demoStore.payments.filter((item) => !transactionIds.includes(item.transactionId));
    return true;
  }

  await getDb()
    .update(queues)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(queues.id, id));
  return true;
}
