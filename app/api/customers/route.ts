import { NextRequest } from "next/server";
import { customerSchema } from "@/schemas/customer";
import { createCustomer, listCustomers } from "@/services/customers";
import { getClientIp } from "@/lib/utils";
import { sanitizeObject } from "@/lib/security/sanitize";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response) return response;

  const query = request.nextUrl.searchParams.get("q") ?? "";
  return jsonResponse(await listCustomers(query));
}

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response || !session) return response;

  const parsed = customerSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi pelanggan gagal", errors: parsed.error.flatten() }, 422);
  }

  const customer = await createCustomer(parsed.data);
  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "customers",
    entityId: customer.id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(customer, 201);
}
