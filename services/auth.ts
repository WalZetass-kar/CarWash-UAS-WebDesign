import { eq, isNull } from "drizzle-orm";
import { demoUsers } from "@/lib/constants";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import { users } from "@/drizzle/schema";
import { verifyPassword } from "@/lib/auth/password";

const demoPasswords: Record<string, string> = {
  "admin@cleanride.my.id": "admin123",
  "petugas@cleanride.my.id": "petugas123",
};

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  if (!hasDatabaseConfig()) {
    const user = demoUsers.find((item) => item.email === normalizedEmail);
    if (!user || demoPasswords[normalizedEmail] !== password || !user.isActive) return null;
    return user;
  }

  const db = getDb();
  const user = await db.query.users.findFirst({
    where: (table, { and }) =>
      and(eq(table.email, normalizedEmail), eq(table.isActive, true), isNull(table.deletedAt)),
  });

  if (!user) return null;
  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) return null;

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}
