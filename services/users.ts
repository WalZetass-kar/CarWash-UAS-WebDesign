import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { users } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import { demoStore } from "@/lib/demo-store";
import { roles } from "@/lib/constants";
import type { User } from "@/lib/data";
import type { UserFormInput } from "@/schemas/auth";
import { hashPassword } from "@/lib/auth/password";

export async function listUsers(query = "", role?: string | null) {
  if (!hasDatabaseConfig()) {
    const normalized = query.toLowerCase();
    return demoStore.users.filter((item) => {
      const matchesQuery = [item.name, item.email, item.role].join(" ").toLowerCase().includes(normalized);
      const matchesRole = role ? item.role === role : true;
      return matchesQuery && matchesRole;
    });
  }

  const roleFilter =
    role && roles.includes(role as (typeof roles)[number]) ? eq(users.role, role as UserFormInput["role"]) : undefined;
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

  if (!hasDatabaseConfig()) {
    const user: User = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      isActive: input.isActive,
      createdAt: new Date().toISOString(),
    };
    demoStore.users = [user, ...demoStore.users];
    demoStore.passwords[user.email] = input.password;
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
  if (!hasDatabaseConfig()) {
    const previousUser = demoStore.users.find((item) => item.id === id);
    demoStore.users = demoStore.users.map((item) =>
      item.id === id
        ? {
            ...item,
            name: input.name,
            email: input.email.toLowerCase(),
            role: input.role,
            isActive: input.isActive,
          }
        : item,
    );
    if (previousUser && previousUser.email !== input.email.toLowerCase()) {
      delete demoStore.passwords[previousUser.email];
    }
    if (input.password) {
      demoStore.passwords[input.email.toLowerCase()] = input.password;
    }
    return demoStore.users.find((item) => item.id === id) ?? null;
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
  if (!hasDatabaseConfig()) {
    demoStore.users = demoStore.users.map((item) =>
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
