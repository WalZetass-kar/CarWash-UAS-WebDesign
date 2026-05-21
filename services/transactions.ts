import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { customers, queues, transactions, washPackages } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import {
  type PaymentStatus,
} from "@/lib/data";
import { demoStore } from "@/lib/demo-store";

export async function listTransactions(query = "", status?: PaymentStatus | null) {
  if (!hasDatabaseConfig()) {
    const normalized = query.toLowerCase();
    return demoStore.transactions.filter((item) => {
      const matchesQuery = [
        item.queueNumber,
        item.customerName,
        item.packageName,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      const matchesStatus = status ? item.status === status : true;
      return matchesQuery && matchesStatus;
    });
  }

  const statusFilter = status ? eq(transactions.status, status) : undefined;
  const searchFilter = query
    ? or(
        ilike(queues.queueNumber, `%${query}%`),
        ilike(customers.name, `%${query}%`),
        ilike(washPackages.name, `%${query}%`),
      )
    : undefined;

  return getDb()
    .select({
      id: transactions.id,
      queueId: transactions.queueId,
      queueNumber: queues.queueNumber,
      customerId: transactions.customerId,
      customerName: customers.name,
      packageId: transactions.packageId,
      packageName: washPackages.name,
      total: transactions.total,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(queues, eq(transactions.queueId, queues.id))
    .innerJoin(customers, eq(transactions.customerId, customers.id))
    .innerJoin(washPackages, eq(transactions.packageId, washPackages.id))
    .where(and(isNull(transactions.deletedAt), statusFilter, searchFilter))
    .orderBy(desc(transactions.createdAt));
}

export async function getTransactionById(id: string) {
  if (!hasDatabaseConfig()) {
    return demoStore.transactions.find((item) => item.id === id) ?? null;
  }

  const [transaction] = await getDb()
    .select({
      id: transactions.id,
      queueId: transactions.queueId,
      queueNumber: queues.queueNumber,
      customerId: transactions.customerId,
      customerName: customers.name,
      packageId: transactions.packageId,
      packageName: washPackages.name,
      total: transactions.total,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(queues, eq(transactions.queueId, queues.id))
    .innerJoin(customers, eq(transactions.customerId, customers.id))
    .innerJoin(washPackages, eq(transactions.packageId, washPackages.id))
    .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)));
  return transaction ?? null;
}

export async function updateTransactionPaymentStatus(id: string, status: PaymentStatus) {
  if (!hasDatabaseConfig()) {
    demoStore.transactions = demoStore.transactions.map((item) =>
      item.id === id ? { ...item, status } : item,
    );
    return demoStore.transactions.find((item) => item.id === id) ?? null;
  }

  const [updated] = await getDb()
    .update(transactions)
    .set({ status, updatedAt: new Date() })
    .where(eq(transactions.id, id))
    .returning();
  return updated ?? null;
}
