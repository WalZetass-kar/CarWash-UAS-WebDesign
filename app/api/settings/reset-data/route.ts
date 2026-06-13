import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";
import { resetOperationalData } from "@/services/settings";
import { logActivity } from "@/services/activity";
import { getClientIp } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin"]);
  if (response || !session) return response;

  try {
    const result = await resetOperationalData();
    revalidateTag("landing-settings", "max");
    revalidateTag("landing-packages", "max");
    revalidateTag("gallery-images-6", "max");

    await logActivity({
      userId: session.user.id,
      action: "reset_data",
      entity: "database",
      ipAddress: getClientIp(request.headers),
      userAgent: request.headers.get("user-agent"),
    });

    return jsonResponse({
      message: "Data operasional berhasil dihapus",
      deleted: result,
    });
  } catch (error) {
    console.error("Failed to reset operational data", error);
    return jsonResponse({ message: "Gagal menghapus data operasional" }, 500);
  }
}
