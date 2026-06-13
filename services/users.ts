import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { activityLogs, transactions, users } from "@/drizzle/schema";
import { getDb, shouldUseDemoData } from "@/drizzle/db";
import { getDemoState, toPublicUser } from "@/lib/demo-store";
import type { User } from "@/lib/data";
import type { UserFormInput } from "@/schemas/auth";
import { hashPassword } from "@/lib/auth/password";

export async function listUsers(query = "", role?: string | null) {
  if (shouldUseDemoData()) {
    const memoryUsers = getDemoState().users.map(toPublicUser);
    const normalized = query.toLowerCase();
    return memoryUsers.filter((item) => {
      const matchesQuery = [item.name, item.email, item.role].join(" ").toLowerCase().includes(normalized);
      const matchesRole = role ? item.role === role : true;
      return matchesQuery && matchesRole;
    });
  }

  const roleFilter =
    role && ["admin", "petugas"].includes(role) ? eq(users.role, role as UserFormInput["role"]) : undefined;
  const searchFilter = query
    ? or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`))
    : undefined;

  return getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(isNull(users.deletedAt), roleFilter, searchFilter))
    .orderBy(desc(users.createdAt));
}

export async function createUser(input: UserFormInput) {
  if (!input.password) throw new Error("Password wajib diisi.");

  if (shouldUseDemoData()) {
    const state = getDemoState();
    const user: User = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      isActive: input.isActive,
      createdAt: new Date().toISOString(),
    };
    state.users = [
      {
        ...user,
        password: input.password,
      },
      ...state.users,
    ];
    return user;
  }

  const [created] = await getDb()
    .insert(users)
    .values({
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      isActive: input.isActive,
      passwordHash: await hashPassword(input.password),
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });
  return created;
}

export async function updateUser(id: string, input: UserFormInput) {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.users = state.users.map((item) =>
      item.id === id
        ? {
            ...item,
            name: input.name,
            email: input.email.toLowerCase(),
            role: input.role,
            isActive: input.isActive,
            password: input.password || item.password,
          }
        : item,
    );
    const updated = state.users.find((item) => item.id === id);
    return updated ? toPublicUser(updated) : null;
  }

  const [updated] = await getDb()
    .update(users)
    .set({
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      isActive: input.isActive,
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });
  return updated ?? null;
}

export async function deactivateUser(id: string) {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.users = state.users.map((item) =>
      item.id === id ? { ...item, isActive: false } : item,
    );
    return true;
  }

  await getDb()
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id));
  return true;
}

export async function deleteUser(id: string) {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.activityLogs = state.activityLogs.map((item) =>
      item.userId === id ? { ...item, userId: null } : item,
    );
    state.users = state.users.filter((item) => item.id !== id);
    return true;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(transactions)
      .set({ createdBy: null, updatedAt: new Date() })
      .where(eq(transactions.createdBy, id));

    await tx
      .update(activityLogs)
      .set({ userId: null, updatedAt: new Date() })
      .where(eq(activityLogs.userId, id));

    await tx.delete(users).where(eq(users.id, id));
  });
  return true;
}
