import { NextRequest } from "next/server";
import { loginSchema } from "@/schemas/auth";
import { authenticateUser } from "@/services/auth";
import { signSession, type SessionUser } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { getClientIp } from "@/lib/utils";
import { rateLimit } from "@/lib/security/rate-limit";
import { sanitizeObject } from "@/lib/security/sanitize";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf } from "@/app/api/_utils";

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const ip = getClientIp(request.headers);
  const limit = rateLimit(`login:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return jsonResponse({ message: "Terlalu banyak percobaan login. Coba lagi nanti." }, 429);
  }

  const body = sanitizeObject(await request.json());
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ message: "Input login tidak valid", errors: parsed.error.flatten() }, 422);
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return jsonResponse({ message: "Email atau password salah, atau user tidak aktif." }, 401);
  }

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = await signSession(sessionUser);
  await setSessionCookie(token, request);

  await logActivity({
    userId: user.id,
    action: "login",
    entity: "auth",
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse({
    message: "Login berhasil",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
