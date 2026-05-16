import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { customers, payments, queues, transactions } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import { demoPayments, type Payment } from "@/lib/data";
import type { PaymentInput } from "@/schemas/payment";
import { getTransactionById, updateTransactionPaymentStatus } from "@/services/transactions";

let memoryPayments: Payment[] = [...demoPayments];

export async function listPayments(query = "", status?: string | null) {
  if (!hasDatabaseConfig()) {
    const normalized = query.toLowerCase();
    return memoryPayments.filter((item) => {
      const matchesQuery = [item.queueNumber, item.customerName, item.method, item.status]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      const matchesStatus = status ? item.status === status : true;
      return matchesQuery && matchesStatus;
    });
  }

  const statusFilter =
    status && ["belum_bayar", "lunas"].includes(status)
      ? eq(payments.status, status as PaymentInput["status"])
      : undefined;
  const searchFilter = query
    ? or(ilike(queues.queueNumber, `%${query}%`), ilike(customers.name, `%${query}%`))
    : undefined;

  return getDb()
    .select({
      id: payments.id,
      transactionId: payments.transactionId,
      queueNumber: queues.queueNumber,
      customerName: customers.name,
      method: payments.method,
      amount: payments.amount,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(transactions, eq(payments.transactionId, transactions.id))
    .innerJoin(queues, eq(transactions.queueId, queues.id))
    .innerJoin(customers, eq(transactions.customerId, customers.id))
    .where(and(isNull(payments.deletedAt), statusFilter, searchFilter))
    .orderBy(desc(payments.createdAt));
}

export async function createPayment(input: PaymentInput) {
  if (!hasDatabaseConfig()) {
    const transaction = await getTransactionById(input.transactionId);
    const payment: Payment = {
      id: crypto.randomUUID(),
      transactionId: input.transactionId,
      queueNumber: transaction?.queueNumber ?? "CR-DEMO",
      customerName: transaction?.customerName ?? "Pelanggan Demo",
      method: input.method,
      amount: input.amount,
      status: input.status,
      paidAt: input.status === "lunas" ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    memoryPayments = [payment, ...memoryPayments];
    await updateTransactionPaymentStatus(input.transactionId, input.status);
    return payment;
  }

  const db = getDb();
  const [created] = await db
    .insert(payments)
    .values({
      ...input,
      paidAt: input.status === "lunas" ? new Date() : null,
    })
    .returning();

  await db
    .update(transactions)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(transactions.id, input.transactionId));

  return created;
}

export async function updatePayment(id: string, input: PaymentInput) {
  if (!hasDatabaseConfig()) {
    const transaction = await getTransactionById(input.transactionId);
    memoryPayments = memoryPayments.map((item) =>
      item.id === id
        ? {
            ...item,
            ...input,
            queueNumber: transaction?.queueNumber ?? item.queueNumber,
            customerName: transaction?.customerName ?? item.customerName,
            paidAt: input.status === "lunas" ? new Date().toISOString() : null,
          }
        : item,
    );
    await updateTransactionPaymentStatus(input.transactionId, input.status);
    return memoryPayments.find((item) => item.id === id) ?? null;
  }

  const db = getDb();
  const [updated] = await db
    .update(payments)
    .set({
      ...input,
      paidAt: input.status === "lunas" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(payments.id, id), isNull(payments.deletedAt)))
    .returning();

  await db
    .update(transactions)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(transactions.id, input.transactionId));

  return updated ?? null;
}
