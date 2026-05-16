import { NextRequest } from "next/server";
import { userFormSchema } from "@/schemas/auth";
import { deactivateUser, updateUser } from "@/services/users";
import { getClientIp } from "@/lib/utils";
import { sanitizeObject } from "@/lib/security/sanitize";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin"]);
  if (response || !session) return response;

  const parsed = userFormSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi user gagal", errors: parsed.error.flatten() }, 422);
  }

  const { id } = await params;
  const user = await updateUser(id, parsed.data);
  await logActivity({
    userId: session.user.id,
    action: parsed.data.password ? "reset_password" : "update",
    entity: "users",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(user);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin"]);
  if (response || !session) return response;

  const { id } = await params;
  await deactivateUser(id);
  await logActivity({
    userId: session.user.id,
    action: "deactivate",
    entity: "users",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse({ ok: true });
}
