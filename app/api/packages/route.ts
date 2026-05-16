import { NextRequest } from "next/server";
import { packageSchema } from "@/schemas/package";
import { createPackage, listPackages } from "@/services/packages";
import { getClientIp } from "@/lib/utils";
import { sanitizeObject } from "@/lib/security/sanitize";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response) return response;

  return jsonResponse(await listPackages(request.nextUrl.searchParams.get("q") ?? ""));
}

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin"]);
  if (response || !session) return response;

  const parsed = packageSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi paket gagal", errors: parsed.error.flatten() }, 422);
  }

  const washPackage = await createPackage(parsed.data);
  await logActivity({
    userId: session.user.id,
    action: "create",
    entity: "wash_packages",
    entityId: washPackage.id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(washPackage, 201);
}
