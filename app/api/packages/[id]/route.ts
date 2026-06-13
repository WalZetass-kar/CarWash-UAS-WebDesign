import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { packageSchema } from "@/schemas/package";
import { deletePackage, updatePackage } from "@/services/packages";
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

  const parsed = packageSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi paket gagal", errors: parsed.error.flatten() }, 422);
  }

  const { id } = await params;
  const washPackage = await updatePackage(id, parsed.data);
  revalidateTag("landing-packages", "max");
  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "wash_packages",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(washPackage);
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
  await deletePackage(id);
  revalidateTag("landing-packages", "max");
  await logActivity({
    userId: session.user.id,
    action: "delete",
    entity: "wash_packages",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse({ ok: true });
}
