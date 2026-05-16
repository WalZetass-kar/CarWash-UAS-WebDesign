import { NextRequest } from "next/server";
import { queueSchema } from "@/schemas/queue";
import { createQueue, listQueues } from "@/services/queues";
import { getClientIp } from "@/lib/utils";
import { sanitizeObject } from "@/lib/security/sanitize";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response) return response;

  return jsonResponse(
    await listQueues(
      request.nextUrl.searchParams.get("q") ?? "",
      request.nextUrl.searchParams.get("status"),
    ),
  );
}

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response || !session) return response;

  const parsed = queueSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi antrian gagal", errors: parsed.error.flatten() }, 422);
  }

  const queue = await createQueue(parsed.data, session.user.id);
  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "queues",
    entityId: queue.id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(queue, 201);
}
