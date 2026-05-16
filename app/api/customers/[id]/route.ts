import { NextRequest } from "next/server";
import { customerSchema } from "@/schemas/customer";
import { deleteCustomer, updateCustomer } from "@/services/customers";
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

  const parsed = customerSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi pelanggan gagal", errors: parsed.error.flatten() }, 422);
  }

  const { id } = await params;
  const customer = await updateCustomer(id, parsed.data);
  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "customers",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(customer);
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
  await deleteCustomer(id);
  await logActivity({
    userId: session.user.id,
    action: "delete",
    entity: "customers",
    entityId: id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse({ ok: true });
}
