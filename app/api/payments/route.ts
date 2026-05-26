import { NextRequest } from "next/server";
import { paymentSchema } from "@/schemas/payment";
import { createPayment, listPayments } from "@/services/payments";
import { getClientIp } from "@/lib/utils";
import { sanitizeObject } from "@/lib/security/sanitize";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin", "kasir", "petugas"]);
  if (response) return response;

  return jsonResponse(
    await listPayments(
      request.nextUrl.searchParams.get("q") ?? "",
      request.nextUrl.searchParams.get("status"),
    ),
  );
}

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin", "kasir", "petugas"]);
  if (response || !session) return response;

  const parsed = paymentSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi pembayaran gagal", errors: parsed.error.flatten() }, 422);
  }

  try {
    const payment = await createPayment(parsed.data);
    await logActivity({
      userId: session.user.id,
      action: "payment",
      entity: "payments",
      entityId: payment.id,
      ipAddress: getClientIp(request.headers),
      userAgent: request.headers.get("user-agent"),
    });

    return jsonResponse(payment, 201);
  } catch (error) {
    return jsonResponse(
      { message: error instanceof Error ? error.message : "Gagal menyimpan pembayaran" },
      422,
    );
  }
}
