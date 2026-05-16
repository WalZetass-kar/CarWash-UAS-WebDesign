import { NextRequest } from "next/server";
import { queueStatusSchema } from "@/schemas/queue";
import { updateQueueStatus } from "@/services/queues";
import { getClientIp } from "@/lib/utils";
import { sanitizeObject } from "@/lib/security/sanitize";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response || !session) return response;

  const parsed = queueStatusSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Status antrian tidak valid", errors: parsed.error.flatten() }, 422);
  }

  const { id } = await params;
  const queue = await updateQueueStatus(id, parsed.data);
  await logActivity({
    userId: session.user.id,
    action: "update_status",
    entity: "queues",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(queue);
}
