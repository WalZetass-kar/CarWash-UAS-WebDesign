import { NextRequest } from "next/server";
import { globalSearch } from "@/services/search";
import { jsonResponse, requireApiRole } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response) return response;

  const query = request.nextUrl.searchParams.get("q") ?? "";
  if (query.length < 2) return jsonResponse([]);

  return jsonResponse(await globalSearch(query));
}
