import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { reportFilterSchema } from "@/schemas/report";
import { getDashboardData } from "@/services/dashboard";
import { requireApiRole } from "@/app/api/_utils";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  const filteredPayments = data.payments.filter((payment) => {
    const date = new Date(payment.createdAt);
    const afterFrom = parsed.data.from ? date >= parsed.data.from : true;
    const beforeTo = parsed.data.to ? date <= parsed.data.to : true;
    return afterFrom && beforeTo;
  });
  const totalIncome = filteredPayments
    .filter((payment) => payment.status === "lunas")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const rows = filteredPayments.map((payment) => ({
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

  if (parsed.data.format === "pdf") {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Laporan Transaksi CleanRide", 14, 18);
    doc.setFontSize(11);
    doc.text(`Total pemasukan: ${formatCurrency(totalIncome)}`, 14, 28);
    doc.text(`Paket populer: ${data.metrics.popularPackage}`, 14, 35);
    autoTable(doc, {
      startY: 44,
      head: [["Tanggal", "Pelanggan", "Invoice", "Metode", "Status", "Total"]],
      body: filteredPayments.map((payment) => [
        formatDate(payment.createdAt),
        payment.customerName,
        payment.queueNumber,
        payment.method,
        payment.status,
        formatCurrency(payment.amount),
      ]),
    });

    return new NextResponse(Buffer.from(doc.output("arraybuffer")), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=cleanride-report.pdf",
      },
    });
  }

  return NextResponse.json({
    metrics: { ...data.metrics, revenueFiltered: totalIncome },
    rows,
  });
}
