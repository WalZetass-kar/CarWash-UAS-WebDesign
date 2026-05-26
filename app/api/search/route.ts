import { NextRequest } from "next/server";
import { globalSearch } from "@/services/search";
import { getApiSession, jsonResponse } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request);
  if (!session) return jsonResponse({ message: "Unauthenticated" }, 401);

  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.length < 2) return jsonResponse([]);

  return jsonResponse(await globalSearch(query));
}
