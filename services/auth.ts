import { eq, isNull } from "drizzle-orm";
import { getDb, shouldUseTestFixtures } from "@/drizzle/db";
import { getDemoState, toPublicUser } from "@/lib/demo-store";
import { users } from "@/drizzle/schema";
import { verifyPassword } from "@/lib/auth/password";

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  if (shouldUseTestFixtures()) {
    const user = getDemoState().users.find((item) => item.email === normalizedEmail);
    if (!user || user.password !== password || !user.isActive) return null;
    return toPublicUser(user);
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
