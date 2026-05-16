import { NextRequest } from "next/server";
import { paymentSchema } from "@/schemas/payment";
import { updatePayment } from "@/services/payments";
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

  const { session, response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response || !session) return response;

  const parsed = paymentSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi pembayaran gagal", errors: parsed.error.flatten() }, 422);
  }

  const { id } = await params;
  const payment = await updatePayment(id, parsed.data);
  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "payments",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(payment);
}
