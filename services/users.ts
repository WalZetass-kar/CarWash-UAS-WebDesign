import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { users } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import { demoUsers } from "@/lib/constants";
import type { User } from "@/lib/data";
import type { UserFormInput } from "@/schemas/auth";
import { hashPassword } from "@/lib/auth/password";

let memoryUsers: User[] = demoUsers.map((user) => ({
  ...user,
  createdAt: new Date().toISOString(),
}));

export async function listUsers(query = "", role?: string | null) {
  if (!hasDatabaseConfig()) {
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

  if (!hasDatabaseConfig()) {
    const user: User = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      role: input.role,
      isActive: input.isActive,
      createdAt: new Date().toISOString(),
    };
    memoryUsers = [user, ...memoryUsers];
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
    memoryUsers = memoryUsers.map((item) =>
      item.id === id
        ? {
            ...item,
            name: input.name,
            email: input.email,
            role: input.role,
            isActive: input.isActive,
          }
        : item,
    );
    return memoryUsers.find((item) => item.id === id) ?? null;
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
    memoryUsers = memoryUsers.map((item) =>
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
