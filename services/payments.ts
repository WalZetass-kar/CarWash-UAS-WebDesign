import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { customers, payments, queues, transactions, washPackages } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import type { Payment } from "@/lib/data";
import { demoStore } from "@/lib/demo-store";
import type { PaymentInput } from "@/schemas/payment";
import { getTransactionById, updateTransactionPaymentStatus } from "@/services/transactions";

async function getPaymentById(id: string) {
  if (!hasDatabaseConfig()) {
    return demoStore.payments.find((item) => item.id === id) ?? null;
  }

  const [payment] = await getDb()
    .select({
      id: payments.id,
      transactionId: payments.transactionId,
      queueNumber: queues.queueNumber,
      customerId: customers.id,
      customerName: customers.name,
      packageName: washPackages.name,
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
    .innerJoin(washPackages, eq(transactions.packageId, washPackages.id))
    .where(and(eq(payments.id, id), isNull(payments.deletedAt)));

  return payment ?? null;
}

export async function listPayments(query = "", status?: string | null) {
  if (!hasDatabaseConfig()) {
    const normalized = query.toLowerCase();
    return demoStore.payments.filter((item) => {
      const matchesQuery = [item.queueNumber, item.customerName, item.packageName, item.method, item.status]
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
      customerId: customers.id,
      customerName: customers.name,
      packageName: washPackages.name,
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
    .innerJoin(washPackages, eq(transactions.packageId, washPackages.id))
    .where(and(isNull(payments.deletedAt), statusFilter, searchFilter))
    .orderBy(desc(payments.createdAt));
}

export async function createPayment(input: PaymentInput) {
  if (!hasDatabaseConfig()) {
    const transaction = await getTransactionById(input.transactionId);
    const existingPayment = demoStore.payments.find((item) => item.transactionId === input.transactionId);
    if (existingPayment) {
      existingPayment.method = input.method;
      existingPayment.amount = input.amount;
      existingPayment.status = input.status;
      existingPayment.paidAt = input.status === "lunas" ? new Date().toISOString() : null;
      await updateTransactionPaymentStatus(input.transactionId, input.status);
      return existingPayment;
    }

    const payment: Payment = {
      id: crypto.randomUUID(),
      transactionId: input.transactionId,
      queueNumber: transaction?.queueNumber ?? "CR-DEMO",
      customerId: transaction?.customerId ?? "customer-demo",
      customerName: transaction?.customerName ?? "Pelanggan Demo",
      packageName: transaction?.packageName ?? null,
      method: input.method,
      amount: input.amount,
      status: input.status,
      paidAt: input.status === "lunas" ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    demoStore.payments = [payment, ...demoStore.payments];
    await updateTransactionPaymentStatus(input.transactionId, input.status);
    return payment;
  }

  const db = getDb();
  const [existingPayment] = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.transactionId, input.transactionId), isNull(payments.deletedAt)));

  if (existingPayment) {
    const updated = await updatePayment(existingPayment.id, input);
    if (!updated) throw new Error("Pembayaran gagal diperbarui");
    return updated;
  }

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

  return (await getPaymentById(created.id)) ?? created;
}

export async function updatePayment(id: string, input: PaymentInput) {
  if (!hasDatabaseConfig()) {
    const transaction = await getTransactionById(input.transactionId);
    demoStore.payments = demoStore.payments.map((item) =>
      item.id === id
        ? {
            ...item,
            ...input,
            queueNumber: transaction?.queueNumber ?? item.queueNumber,
            customerId: transaction?.customerId ?? item.customerId,
            customerName: transaction?.customerName ?? item.customerName,
            packageName: transaction?.packageName ?? item.packageName,
            paidAt: input.status === "lunas" ? new Date().toISOString() : null,
          }
        : item,
    );
    await updateTransactionPaymentStatus(input.transactionId, input.status);
    return demoStore.payments.find((item) => item.id === id) ?? null;
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

  return updated ? await getPaymentById(id) : null;
}
