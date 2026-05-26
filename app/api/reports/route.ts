import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { reportFilterSchema } from "@/schemas/report";
import { requireApiRole } from "@/app/api/_utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReportData } from "@/services/reports";

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

  const { rows, totalIncome, settings } = await getReportData(parsed.data);
  const popularPackage =
    Object.entries(rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.packageName] = (acc[row.packageName] ?? 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  const exportRows = rows.map((row) => ({
    tanggal: row.createdAt,
    pelanggan: row.customerName,
    antrian: row.queueNumber,
    metode: row.method ?? "-",
    status: row.status,
    total: row.total,
  }));

  if (parsed.data.format === "csv") {
    const header = Object.keys(
      exportRows[0] ?? { tanggal: "", pelanggan: "", antrian: "", metode: "", status: "", total: "" },
    );
    const csv = [
      header.join(","),
      ...exportRows.map((row) =>
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

  if (parsed.data.format === "excel") {
    const html = `
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Pelanggan</th>
            <th>Invoice</th>
            <th>Metode</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${filteredPayments
            .map(
              (payment) => `
                <tr>
                  <td>${formatDate(payment.createdAt)}</td>
                  <td>${payment.customerName}</td>
                  <td>${payment.queueNumber}</td>
                  <td>${payment.method}</td>
                  <td>${payment.status}</td>
                  <td>${payment.amount}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": "attachment; filename=cleanride-report.xls",
      },
    });
  }

  if (parsed.data.format === "pdf") {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Laporan Transaksi ${settings.businessName}`, 14, 18);
    doc.setFontSize(11);
    doc.text(`Total pemasukan: ${formatCurrency(totalIncome)}`, 14, 28);
    doc.text(`Paket populer: ${popularPackage}`, 14, 35);
    autoTable(doc, {
      startY: 44,
      head: [["Tanggal", "Pelanggan", "Invoice", "Metode", "Status", "Total"]],
      body: rows.map((row) => [
        formatDate(row.createdAt),
        row.customerName,
        row.queueNumber,
        row.method ?? "-",
        row.status,
        formatCurrency(row.total),
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
    metrics: {
      revenueFiltered: totalIncome,
      transactionCount: rows.length,
      popularPackage,
    },
    rows: exportRows,
  });
}
