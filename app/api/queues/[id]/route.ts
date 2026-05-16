import { NextRequest } from "next/server";
import { deleteQueue } from "@/services/queues";
import { getClientIp } from "@/lib/utils";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin"]);
  if (response || !session) return response;

  const { id } = await params;
  await deleteQueue(id);
  await logActivity({
    userId: session.user.id,
    action: "delete",
    entity: "queues",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse({ ok: true });
}
