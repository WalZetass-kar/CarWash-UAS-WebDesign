import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { customers, payments, queues, transactions, washPackages } from "@/drizzle/schema";
import { getDb, shouldUseTestFixtures } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { type QueueItem } from "@/lib/data";
import { getHourKey } from "@/lib/utils";
import { queueStatuses } from "@/lib/constants";
import type { QueueInput, QueueStatusInput } from "@/schemas/queue";
import { getAppSettings } from "@/services/settings";
import { createMemoryTransaction } from "@/services/transactions";

type CreateQueueInput = Omit<QueueInput, "discount"> & {
  discount?: number;
};

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
  if (shouldUseTestFixtures()) {
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
    status && (queueStatuses as readonly string[]).includes(status)
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
      customerPhone: customers.phone,
      packageName: washPackages.name,
      licensePlate: customers.licensePlate,
      scheduledAt: queues.scheduledAt,
      status: queues.status,
      total: sql<number>`coalesce(${transactions.total}, ${washPackages.price})`,
      createdAt: queues.createdAt,
    })
    .from(queues)
    .innerJoin(customers, eq(queues.customerId, customers.id))
    .innerJoin(washPackages, eq(queues.packageId, washPackages.id))
    .leftJoin(transactions, and(eq(transactions.queueId, queues.id), isNull(transactions.deletedAt)))
    .where(and(isNull(queues.deletedAt), statusFilter, searchFilter))
    .orderBy(desc(queues.createdAt));
}

export async function getQueueByPlate(plate: string) {
  if (shouldUseTestFixtures()) {
    const { queues: memoryQueues } = getDemoState();
    return memoryQueues.find((item) => item.licensePlate.replace(/\s+/g, "").toUpperCase() === plate.replace(/\s+/g, "").toUpperCase()) ?? null;
  }

  const [row] = await getDb()
    .select({
      id: queues.id,
      queueNumber: queues.queueNumber,
      customerName: customers.name,
      packageName: washPackages.name,
      licensePlate: customers.licensePlate,
      scheduledAt: queues.scheduledAt,
      status: queues.status,
      createdAt: queues.createdAt,
    })
    .from(queues)
    .innerJoin(customers, eq(queues.customerId, customers.id))
    .innerJoin(washPackages, eq(queues.packageId, washPackages.id))
    .where(
      and(
        sql`upper(replace(${customers.licensePlate}, ' ', '')) = ${plate.replace(/\s+/g, "").toUpperCase()}`,
        isNull(queues.deletedAt),
      ),
    )
    .orderBy(desc(queues.createdAt))
    .limit(1);

  return row ?? null;
}

export async function createQueue(input: CreateQueueInput, createdBy?: string): Promise<QueueItem> {
  const settings = await getAppSettings();
  const requestedHourKey = getHourKey(input.scheduledAt);
  if (!requestedHourKey) {
    throw new Error("Jadwal antrian tidak valid.");
  }

  if (shouldUseTestFixtures()) {
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
    const discount = input.discount ?? 0;
    if (discount > washPackage.price) {
      throw new Error("Diskon tidak boleh lebih besar dari harga paket.");
    }
    const total = washPackage.price - discount;

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
      total,
      createdAt: new Date().toISOString(),
    };
    state.queues = [queue, ...memoryQueues];
    createMemoryTransaction({
      id: crypto.randomUUID(),
      queueId: queue.id,
      queueNumber: queue.queueNumber,
      customerId: customer.id,
      customerName: customer.name,
      licensePlate: customer.licensePlate,
      vehicleType: customer.vehicleType,
      packageId: washPackage.id,
      packageName: washPackage.name,
      subtotal: washPackage.price,
      discount,
      total,
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
        const [customer] = await tx
          .select()
          .from(customers)
          .where(and(eq(customers.id, input.customerId), isNull(customers.deletedAt)));
        if (!customer) throw new Error("Pelanggan tidak ditemukan.");
        const discount = input.discount ?? 0;
        if (discount > washPackage.price) {
          throw new Error("Diskon tidak boleh lebih besar dari harga paket.");
        }
        const total = washPackage.price - discount;

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
          discount,
          total,
          status: "belum_bayar",
          createdBy,
        });

        return {
          id: created.id,
          queueNumber: created.queueNumber,
          customerId: created.customerId,
          packageId: created.packageId,
          customerName: customer.name,
          packageName: washPackage.name,
          licensePlate: customer.licensePlate,
          scheduledAt: toIsoString(created.scheduledAt),
          status: created.status,
          total,
          createdAt: toIsoString(created.createdAt),
        };
      });
    } catch (error) {
      if (attempt < 2 && isUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw new Error("Gagal membuat nomor antrian.");
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export async function updateQueueStatus(id: string, input: QueueStatusInput) {
  if (shouldUseTestFixtures()) {
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
  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    const transactionIds = new Set(
      state.transactions.filter((transaction) => transaction.queueId === id).map((transaction) => transaction.id),
    );
    state.payments = state.payments.filter((payment) => !transactionIds.has(payment.transactionId));
    state.transactions = state.transactions.filter((transaction) => transaction.queueId !== id);
    state.queues = state.queues.filter((item) => item.id !== id);
    return true;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const transactionRows = await tx
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.queueId, id));
    const transactionIds = transactionRows.map((row) => row.id);

    if (transactionIds.length > 0) {
      await tx.delete(payments).where(inArray(payments.transactionId, transactionIds));
      await tx.delete(transactions).where(inArray(transactions.id, transactionIds));
    }

    await tx.delete(queues).where(eq(queues.id, id));
  });
  return true;
}
