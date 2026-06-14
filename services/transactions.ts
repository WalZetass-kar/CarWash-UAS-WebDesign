import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { customers, queues, transactions, washPackages } from "@/drizzle/schema";
import { getDb, shouldUseTestFixtures } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { type PaymentStatus, type TransactionItem } from "@/lib/data";

export async function listTransactions(query = "", status?: PaymentStatus | null) {
  if (shouldUseTestFixtures()) {
    const { transactions: memoryTransactions } = getDemoState();
    const normalized = query.toLowerCase();
    return memoryTransactions.filter((item) => {
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

  try {
    const statusFilter = status ? eq(transactions.status, status) : undefined;
    const searchFilter = query
      ? or(
          ilike(queues.queueNumber, `%${query}%`),
          ilike(customers.name, `%${query}%`),
          ilike(washPackages.name, `%${query}%`),
        )
      : undefined;

    return await getDb()
      .select({
        id: transactions.id,
        queueId: transactions.queueId,
        queueNumber: queues.queueNumber,
        customerId: transactions.customerId,
        customerName: customers.name,
        licensePlate: customers.licensePlate,
        vehicleType: customers.vehicleType,
        packageId: transactions.packageId,
        packageName: washPackages.name,
        subtotal: transactions.subtotal,
        discount: transactions.discount,
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
  } catch (error) {
    console.error("Failed to list transactions", error);
    return [];
  }
}

export async function getTransactionById(id: string) {
  if (shouldUseTestFixtures()) {
    return getDemoState().transactions.find((item) => item.id === id) ?? null;
  }

  const [transaction] = await getDb()
    .select({
      id: transactions.id,
      queueId: transactions.queueId,
      queueNumber: queues.queueNumber,
      customerId: transactions.customerId,
      customerName: customers.name,
      licensePlate: customers.licensePlate,
      vehicleType: customers.vehicleType,
      packageId: transactions.packageId,
      packageName: washPackages.name,
      subtotal: transactions.subtotal,
      discount: transactions.discount,
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

export function createMemoryTransaction(transaction: TransactionItem) {
  const state = getDemoState();
  state.transactions = [transaction, ...state.transactions];
  return transaction;
}

export async function updateTransactionPaymentStatus(id: string, status: PaymentStatus) {
  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    state.transactions = state.transactions.map((item) =>
      item.id === id ? { ...item, status } : item,
    );
    return state.transactions.find((item) => item.id === id) ?? null;
  }

  const [updated] = await getDb()
    .update(transactions)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
    .returning();
  return updated ?? null;
}
