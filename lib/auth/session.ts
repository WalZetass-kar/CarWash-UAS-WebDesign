import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { verifySession } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

export async function getCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/aksesadmincarwash");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) redirect("/dashboard");
  return session;
}
