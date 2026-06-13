import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";
import { appSettingsSchema } from "@/schemas/settings";
import { sanitizeObject } from "@/lib/security/sanitize";
import { getClientIp } from "@/lib/utils";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { logActivity } from "@/services/activity";
import { getAppSettings, updateAppSettings } from "@/services/settings";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin"]);
  if (response) return response;

  return jsonResponse(await withDatabaseRetry(() => getAppSettings()));
}

export async function PUT(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin"]);
  if (response || !session) return response;

  const parsed = appSettingsSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi pengaturan gagal", errors: parsed.error.flatten() }, 422);
  }

  const settings = await withDatabaseRetry(() => updateAppSettings(parsed.data));
  revalidateTag("landing-settings", "max");
  await logActivity({
    userId: session.user.id,
    action: "update",
    entity: "settings",
    entityId: settings.id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(settings);
}
