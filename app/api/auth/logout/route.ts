import { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { getClientIp } from "@/lib/utils";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiSession } from "@/app/api/_utils";

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session } = await requireApiSession(request);
  if (session) {
    await logActivity({
      userId: session.user.id,
      action: "logout",
      entity: "auth",
      ipAddress: getClientIp(request.headers),
      userAgent: request.headers.get("user-agent"),
    });
  }

  await clearSessionCookie();
  return jsonResponse({ message: "Logout berhasil" });
}
