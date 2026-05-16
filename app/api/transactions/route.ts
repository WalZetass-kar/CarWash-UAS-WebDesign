import { NextRequest } from "next/server";
import { listTransactions } from "@/services/transactions";
import { jsonResponse, requireApiRole } from "@/app/api/_utils";
import type { PaymentStatus } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin", "petugas"]);
  if (response) return response;

  const status = request.nextUrl.searchParams.get("status") as PaymentStatus | null;
  const query = request.nextUrl.searchParams.get("q") ?? "";

  return jsonResponse(await listTransactions(query, status));
}
