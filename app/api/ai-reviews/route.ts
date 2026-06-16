import { NextRequest } from "next/server";
import { aiReviewSchema } from "@/schemas/ai-review";
import { createAiReviewAnalysis, listAiReviews } from "@/services/ai-reviews";
import { getClientIp } from "@/lib/utils";
import { sanitizeObject } from "@/lib/security/sanitize";
import { logActivity } from "@/services/activity";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin", "kasir", "staff", "petugas"]);
  if (response) return response;

  return jsonResponse(
    await listAiReviews(
      request.nextUrl.searchParams.get("q") ?? "",
      request.nextUrl.searchParams.get("sentiment"),
    ),
  );
}

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { session, response } = await requireApiRole(request, ["admin", "kasir", "staff", "petugas"]);
  if (response || !session) return response;

  const parsed = aiReviewSchema.safeParse(sanitizeObject(await request.json()));
  if (!parsed.success) {
    return jsonResponse({ message: "Validasi review pelanggan gagal", errors: parsed.error.flatten() }, 422);
  }

  const analysis = await createAiReviewAnalysis(parsed.data);
  await logActivity({
    userId: session.user.id,
    action: "analyze",
    entity: "ai_review_analyses",
    entityId: analysis.id,
    ipAddress: getClientIp(request.headers),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonResponse(analysis, 201);
}
