import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { customers, payments, queues, transactions } from "@/drizzle/schema";
import { getDb, shouldUseTestFixtures } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { type Customer } from "@/lib/data";
import type { CustomerInput } from "@/schemas/customer";

export async function listCustomers(query = "") {
  if (shouldUseTestFixtures()) {
    const { customers: memoryCustomers, queues: memoryQueues } = getDemoState();
    const normalized = query.toLowerCase();
    return memoryCustomers
      .map((customer) => ({
        ...customer,
        visitCount: memoryQueues.filter((q) => q.customerId === customer.id && q.status === "selesai")
          .length,
      }))
      .filter((customer) =>
        [customer.name, customer.phone, customer.licensePlate, customer.vehicleType]
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      );
  }

  const db = getDb();

  const visitCounts = db
    .select({
      customerId: queues.customerId,
      count: sql<number>`count(${queues.id})`.as("visit_count"),
    })
    .from(queues)
    .where(eq(queues.status, "selesai"))
    .groupBy(queues.customerId)
    .as("visit_counts");

  const where = query
    ? and(
        isNull(customers.deletedAt),
        or(
          ilike(customers.name, `%${query}%`),
          ilike(customers.phone, `%${query}%`),
          ilike(customers.licensePlate, `%${query}%`),
        ),
      )
    : isNull(customers.deletedAt);

  return db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      licensePlate: customers.licensePlate,
      vehicleType: customers.vehicleType,
      notes: customers.notes,
      createdAt: customers.createdAt,
      visitCount: sql<number>`coalesce(${visitCounts.count}, 0)`,
    })
    .from(customers)
    .leftJoin(visitCounts, eq(customers.id, visitCounts.customerId))
    .where(where)
    .orderBy(desc(customers.createdAt));
}

export async function createCustomer(input: CustomerInput) {
  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    const customer: Customer = {
      id: crypto.randomUUID(),
      ...input,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    state.customers = [customer, ...state.customers];
    return customer;
  }

  const [created] = await getDb().insert(customers).values(input).returning();
  return created;
}

export async function updateCustomer(id: string, input: CustomerInput) {
  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    state.customers = state.customers.map((customer) =>
      customer.id === id ? { ...customer, ...input, notes: input.notes } : customer,
    );
    return state.customers.find((customer) => customer.id === id) ?? null;
  }

  const [updated] = await getDb()
    .update(customers)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
    .returning();
  return updated ?? null;
}

export async function deleteCustomer(id: string) {
  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    const transactionIds = new Set(
      state.transactions.filter((transaction) => transaction.customerId === id).map((transaction) => transaction.id),
    );
    state.payments = state.payments.filter((payment) => !transactionIds.has(payment.transactionId));
    state.transactions = state.transactions.filter((transaction) => transaction.customerId !== id);
    state.queues = state.queues.filter((queue) => queue.customerId !== id);
    state.customers = state.customers.filter((customer) => customer.id !== id);
    return true;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const transactionRows = await tx
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.customerId, id));
    const transactionIds = transactionRows.map((row) => row.id);

    if (transactionIds.length > 0) {
      await tx.delete(payments).where(inArray(payments.transactionId, transactionIds));
      await tx.delete(transactions).where(inArray(transactions.id, transactionIds));
    }

    await tx.delete(queues).where(eq(queues.customerId, id));
    await tx.delete(customers).where(eq(customers.id, id));
  });
  return true;
}
