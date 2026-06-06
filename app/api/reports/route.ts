import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { reportFilterSchema } from "@/schemas/report";
import { requireApiRole } from "@/app/api/_utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReportData } from "@/services/reports";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/constants";
import { createSimpleXlsxBuffer } from "@/lib/export/simple-xlsx";

export async function GET(request: NextRequest) {
  const { response } = await requireApiRole(request, ["admin"]);
  if (response) return response;

  const parsed = reportFilterSchema.safeParse({
    from: request.nextUrl.searchParams.get("from") || undefined,
    to: request.nextUrl.searchParams.get("to") || undefined,
    method: request.nextUrl.searchParams.get("method") || undefined,
    status: request.nextUrl.searchParams.get("status") || undefined,
    packageName: request.nextUrl.searchParams.get("packageName") || undefined,
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
    tanggal: formatDate(row.createdAt),
    pelanggan: row.customerName,
    antrian: row.queueNumber,
    paket: row.packageName,
    metode: row.method ? paymentMethodLabels[row.method] : "-",
    status: paymentStatusLabels[row.status],
    subtotal: row.subtotal,
    diskon: row.discount,
    total: row.total,
  }));

  if (parsed.data.format === "csv") {
    const header = Object.keys(
      exportRows[0] ?? {
        tanggal: "",
        pelanggan: "",
        antrian: "",
        paket: "",
        metode: "",
        status: "",
        subtotal: "",
        diskon: "",
        total: "",
      },
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
        "Content-Disposition": "attachment; filename=kilapkendaraan-report.csv",
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
      head: [["Tanggal", "Pelanggan", "Invoice", "Paket", "Metode", "Status", "Subtotal", "Diskon", "Total"]],
      body: rows.map((row) => [
        formatDate(row.createdAt),
        row.customerName,
        row.queueNumber,
        row.packageName,
        row.method ? paymentMethodLabels[row.method] : "-",
        paymentStatusLabels[row.status],
        formatCurrency(row.subtotal),
        formatCurrency(row.discount),
        formatCurrency(row.total),
      ]),
    });

    return new NextResponse(Buffer.from(doc.output("arraybuffer")), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=kilapkendaraan-report.pdf",
      },
    });
  }

  if (parsed.data.format === "xlsx") {
    const buffer = createSimpleXlsxBuffer("Laporan", exportRows);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=kilapkendaraan-report.xlsx",
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
