import { NextRequest } from "next/server";
import { jsonResponse, rejectInvalidCsrf, rejectUnavailableBackend } from "@/app/api/_utils";
import { publicBookingSchema } from "@/schemas/public-booking";
import { sanitizeObject } from "@/lib/security/sanitize";
import { getClientIp } from "@/lib/utils";
import { rateLimit } from "@/lib/security/rate-limit";
import { logActivity } from "@/services/activity";
import { createPublicBooking } from "@/services/bookings";

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const backendResponse = rejectUnavailableBackend();
  if (backendResponse) return backendResponse;

  const ip = getClientIp(request.headers);
  const limit = rateLimit(`public-booking:${ip}`, 8, 60_000);
  if (!limit.ok) {
    return jsonResponse({ message: "Terlalu banyak booking dalam waktu singkat. Coba lagi sebentar." }, 429);
  }

  const parsed = publicBookingSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Data booking tidak valid", errors: parsed.error.flatten() }, 422);
  }

  try {
    const booking = await createPublicBooking(parsed.data);
    await logActivity({
      action: "create",
      entity: "queues",
      entityId: booking.queue.id,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent"),
    });

    return jsonResponse(
      {
        message: "Booking berhasil dibuat",
        booking: {
          customerName: booking.customer.name,
          licensePlate: booking.customer.licensePlate,
          packageName: booking.packageName,
          queueNumber: booking.queue.queueNumber,
          scheduledAt: booking.queue.scheduledAt,
          total: booking.total,
          status: "menunggu",
        },
      },
      201,
    );
  } catch (error) {
    return jsonResponse(
      { message: error instanceof Error ? error.message : "Gagal membuat booking" },
      422,
    );
  }
}
