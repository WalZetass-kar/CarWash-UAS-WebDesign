import { NextRequest, NextResponse } from "next/server";
import { reportFilterSchema } from "@/schemas/report";
import { getDashboardData } from "@/services/dashboard";
import { requireApiRole } from "@/app/api/_utils";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin"]);
  if (response) return response;

  const parsed = reportFilterSchema.safeParse({
    from: request.nextUrl.searchParams.get("from") || undefined,
    to: request.nextUrl.searchParams.get("to") || undefined,
    format: request.nextUrl.searchParams.get("format") || "json",
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Filter laporan tidak valid" }, { status: 422 });
  }

  const data = await getDashboardData();
  const rows = data.payments.map((payment) => ({
    tanggal: payment.createdAt,
    pelanggan: payment.customerName,
    antrian: payment.queueNumber,
    metode: payment.method,
    status: payment.status,
    total: payment.amount,
  }));

  if (parsed.data.format === "csv") {
    const header = Object.keys(rows[0] ?? { tanggal: "", pelanggan: "", antrian: "", metode: "", status: "", total: "" });
    const csv = [
      header.join(","),
      ...rows.map((row) =>
        header
          .map((key) => `"${String(row[key as keyof typeof row] ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=cleanride-report.csv",
      },
    });
  }

  return NextResponse.json({
    metrics: data.metrics,
    rows,
  });
}
