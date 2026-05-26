import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { customers } from "@/drizzle/schema";
import { getDb, shouldUseDemoData } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { type Customer } from "@/lib/data";
import type { CustomerInput } from "@/schemas/customer";

export async function listCustomers(query = "") {
  if (shouldUseDemoData()) {
    const { customers: memoryCustomers } = getDemoState();
    const normalized = query.toLowerCase();
    return memoryCustomers.filter((customer) =>
      [customer.name, customer.phone, customer.licensePlate, customer.vehicleType]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }

  const db = getDb();
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

  return db.select().from(customers).where(where).orderBy(desc(customers.createdAt));
}

export async function createCustomer(input: CustomerInput) {
  if (shouldUseDemoData()) {
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

  const [created] = await getDb()
    .insert(customers)
    .values(input)
    .returning();
  return created;
}

export async function updateCustomer(id: string, input: CustomerInput) {
  if (shouldUseDemoData()) {
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
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.customers = state.customers.filter((customer) => customer.id !== id);
    return true;
  }

  await getDb()
    .update(customers)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(customers.id, id));
  return true;
}
