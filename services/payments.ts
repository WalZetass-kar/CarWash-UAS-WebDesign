import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { customers, payments, queues, transactions } from "@/drizzle/schema";
import { getDb, shouldUseTestFixtures } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { type Payment, type PaymentStatus } from "@/lib/data";
import type { PaymentInput } from "@/schemas/payment";
import { getTransactionById, updateTransactionPaymentStatus } from "@/services/transactions";

type PayableTransaction = {
  status: PaymentStatus;
  total: number;
};

function validatePaymentStatus(status: PaymentInput["status"]) {
  if (status !== "lunas") {
    throw new Error("Pembayaran hanya dapat disimpan saat transaksi benar-benar lunas.");
  }
}

function validatePaymentAmount<T extends PayableTransaction>(
  transaction: T | null,
  amount: number,
): asserts transaction is T {
  if (!transaction) throw new Error("Transaksi tidak ditemukan.");
  if (Number(transaction.total) !== Number(amount)) {
    throw new Error("Nominal pembayaran harus sama dengan total transaksi.");
  }
}

function validatePendingTransaction<T extends PayableTransaction>(
  transaction: T | null,
  amount: number,
): asserts transaction is T {
  validatePaymentAmount(transaction, amount);
  if (transaction?.status !== "belum_bayar") {
    throw new Error("Transaksi sudah dibayar atau tidak lagi pending.");
  }
}

export async function listPayments(query = "", status?: string | null) {
  if (shouldUseTestFixtures()) {
    if (status === "belum_bayar") return [];

    const { payments: memoryPayments } = getDemoState();
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

  if (status === "belum_bayar") return [];

  try {
    const statusFilter =
      status && status === "lunas"
        ? eq(payments.status, status as PaymentInput["status"])
        : undefined;
    const searchFilter = query
      ? or(ilike(queues.queueNumber, `%${query}%`), ilike(customers.name, `%${query}%`))
      : undefined;

    return await getDb()
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
  } catch (error) {
    console.error("Failed to list payments", error);
    return [];
  }
}

export async function createPayment(input: PaymentInput) {
  validatePaymentStatus(input.status);

  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    const transaction = await getTransactionById(input.transactionId);
    validatePendingTransaction(transaction, input.amount);
    const existingPayment = state.payments.find((item) => item.transactionId === input.transactionId);
    if (existingPayment) {
      throw new Error("Transaksi ini sudah memiliki pembayaran.");
    }
    const payment: Payment = {
      id: crypto.randomUUID(),
      transactionId: input.transactionId,
      queueNumber: transaction.queueNumber,
      customerName: transaction.customerName,
      method: input.method,
      amount: input.amount,
      status: input.status,
      paidAt: input.status === "lunas" ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    state.payments = [payment, ...state.payments];
    await updateTransactionPaymentStatus(input.transactionId, input.status);
    return payment;
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [existingPayment] = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.transactionId, input.transactionId), isNull(payments.deletedAt)));
    if (existingPayment) {
      throw new Error("Transaksi ini sudah memiliki pembayaran.");
    }

    const [transaction] = await tx
      .select({
        id: transactions.id,
        total: transactions.total,
        status: transactions.status,
      })
      .from(transactions)
      .where(and(eq(transactions.id, input.transactionId), isNull(transactions.deletedAt)));
    const targetTransaction = transaction ?? null;
    validatePendingTransaction(targetTransaction, input.amount);

    const [created] = await tx
      .insert(payments)
      .values({
        ...input,
        paidAt: input.status === "lunas" ? new Date() : null,
      })
      .returning();

    await tx
      .update(transactions)
      .set({ status: input.status, updatedAt: new Date() })
      .where(and(eq(transactions.id, input.transactionId), isNull(transactions.deletedAt)));

    const [payment] = await tx
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
      .where(eq(payments.id, created.id));

    return payment;
  });
}

export async function updatePayment(id: string, input: PaymentInput) {
  validatePaymentStatus(input.status);

  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    const existing = state.payments.find((item) => item.id === id);
    if (!existing) throw new Error("Pembayaran tidak ditemukan.");
    const paymentForTransaction = state.payments.find(
      (item) => item.transactionId === input.transactionId && item.id !== id,
    );
    if (paymentForTransaction) {
      throw new Error("Transaksi ini sudah memiliki pembayaran.");
    }
    const transaction = await getTransactionById(input.transactionId);
    validatePaymentAmount(transaction, input.amount);
    if (transaction.status !== "belum_bayar" && existing.transactionId !== input.transactionId) {
      throw new Error("Transaksi sudah dibayar atau tidak lagi pending.");
    }
    state.payments = state.payments.map((item) =>
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
    if (existing.transactionId !== input.transactionId) {
      await updateTransactionPaymentStatus(existing.transactionId, "belum_bayar");
    }
    await updateTransactionPaymentStatus(input.transactionId, input.status);
    return state.payments.find((item) => item.id === id) ?? null;
  }

  const db = getDb();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ transactionId: payments.transactionId })
      .from(payments)
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)));
    if (!existing) throw new Error("Pembayaran tidak ditemukan.");

    const [paymentForTransaction] = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.transactionId, input.transactionId),
          isNull(payments.deletedAt),
        ),
      );
    if (paymentForTransaction && existing.transactionId !== input.transactionId) {
      throw new Error("Transaksi ini sudah memiliki pembayaran.");
    }

    const [transaction] = await tx
      .select({
        id: transactions.id,
        total: transactions.total,
        status: transactions.status,
      })
      .from(transactions)
      .where(and(eq(transactions.id, input.transactionId), isNull(transactions.deletedAt)));
    const targetTransaction = transaction ?? null;
    validatePaymentAmount(targetTransaction, input.amount);
    if (targetTransaction.status !== "belum_bayar" && existing.transactionId !== input.transactionId) {
      throw new Error("Transaksi sudah dibayar atau tidak lagi pending.");
    }

    const [updated] = await tx
      .update(payments)
      .set({
        ...input,
        paidAt: input.status === "lunas" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(payments.id, id), isNull(payments.deletedAt)))
      .returning();
    if (!updated) return null;

    if (existing.transactionId !== input.transactionId) {
      await tx
        .update(transactions)
        .set({ status: "belum_bayar", updatedAt: new Date() })
        .where(and(eq(transactions.id, existing.transactionId), isNull(transactions.deletedAt)));
    }

    await tx
      .update(transactions)
      .set({ status: input.status, updatedAt: new Date() })
      .where(and(eq(transactions.id, input.transactionId), isNull(transactions.deletedAt)));

    const [payment] = await tx
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
      .where(eq(payments.id, updated.id));

    return payment ?? null;
  });
}
