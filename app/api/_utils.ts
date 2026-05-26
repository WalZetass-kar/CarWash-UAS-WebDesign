import { NextRequest, NextResponse } from "next/server";
import { hasDatabaseConfig, isDemoModeEnabled } from "@/drizzle/db";
import { SESSION_COOKIE, type Role } from "@/lib/constants";
import { verifySession } from "@/lib/auth/jwt";
import { validateCsrf } from "@/lib/security/csrf";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function getApiSession(request: NextRequest) {
  return verifySession(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function requireApiSession(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) {
    return {
      session: null,
      response: jsonResponse({ message: "Unauthenticated" }, 401),
    };
  }

  return { session, response: null };
}

export async function requireApiRole(request: NextRequest, roles: Role[]) {
  const { session, response } = await requireApiSession(request);
  if (response || !session) return { session, response };

  if (!roles.includes(session.user.role)) {
    return {
      session,
      response: jsonResponse({ message: "Akses ditolak" }, 403),
    };
  }

  return { session, response: null };
}

export function rejectInvalidCsrf(request: NextRequest) {
  if (!validateCsrf(request)) {
    return jsonResponse({ message: "CSRF token tidak valid" }, 403);
  }
  return null;
}

export function rejectUnavailableBackend() {
  if (hasDatabaseConfig() || isDemoModeEnabled()) {
    return null;
  }

  return jsonResponse(
    {
      message:
        "Backend belum siap. Isi DATABASE_URL pada environment deployment, lalu redeploy aplikasi.",
    },
    503,
  );
}
