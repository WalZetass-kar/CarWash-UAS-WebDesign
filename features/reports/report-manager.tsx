"use client";

import { useMemo, useState } from "react";
import Flatpickr from "react-flatpickr";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import type { ReportRow } from "@/lib/data";
import { formatCurrency, formatDate, formatDateInput } from "@/lib/utils";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/constants";
import { MonthlyLineChart, PaymentPieChart } from "@/features/dashboard/charts";

export function ReportManager({
  rows,
  monthlyRevenue,
  popularPackage,
  businessName,
  defaultRangeDays,
}: {
  rows: ReportRow[];
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  popularPackage: string;
  businessName: string;
  defaultRangeDays: number;
}) {
  const [range, setRange] = useState<Date[]>(() => buildDefaultRange(defaultRangeDays));
  const filtered = useMemo(() => {
    if (range.length < 2) return rows;
    const [from, to] = range;
    const fromKey = formatDateInput(from);
    const toKey = formatDateInput(to);

    return rows.filter((row) => {
      const dateKey = formatDateInput(row.createdAt);
      return dateKey >= fromKey && dateKey <= toKey;
    });
  }, [rows, range]);
  const paid = filtered.filter((row) => row.status === "lunas");
  const total = paid.reduce((sum, row) => sum + Number(row.total), 0);

  function exportCsv() {
    window.location.href = `/api/reports?format=csv${buildRangeParams(range)}`;
  }

  function exportPdf() {
    window.location.href = `/api/reports?format=pdf${buildRangeParams(range)}`;
  }

  const columns = useMemo<ColumnDef<ReportRow>[]>(
    () => [
      { accessorKey: "queueNumber", header: "Invoice" },
      { accessorKey: "customerName", header: "Pelanggan" },
      { accessorKey: "packageName", header: "Paket" },
      {
        accessorKey: "method",
        header: "Metode",
        cell: ({ row }) => (row.original.method ? paymentMethodLabels[row.original.method] : "-"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => paymentStatusLabels[row.original.status],
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.total),
      },
      {
        accessorKey: "createdAt",
        header: "Tanggal",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Total pemasukan</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Jumlah transaksi</p>
            <p className="mt-2 text-2xl font-semibold">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-slate-500">Paket populer</p>
            <p className="mt-2 text-2xl font-semibold">{popularPackage}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <CardTitle>Filter & Export</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Flatpickr
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:w-auto sm:text-sm"
                value={range}
                options={{ mode: "range", dateFormat: "Y-m-d" }}
                onChange={setRange}
                placeholder="Filter tanggal"
              />
              <Button variant="outline" onClick={exportCsv} className="w-full sm:w-auto sm:flex-none">
                <Download className="size-4" />
                CSV
              </Button>
              <Button onClick={exportPdf} className="w-full sm:w-auto sm:flex-none">
                <FileDown className="size-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} searchPlaceholder="Cari laporan..." />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan Bulanan {businessName}</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyLineChart data={monthlyRevenue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Metode & Status</CardTitle>
              <Badge>Chart.js</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <PaymentPieChart paid={paid.length} unpaid={filtered.length - paid.length} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function buildRangeParams(range: Date[]) {
  if (range.length < 2) return "";
  const [from, to] = range;
  return `&from=${formatDateInput(from)}&to=${formatDateInput(to)}`;
}

function buildDefaultRange(defaultRangeDays: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (defaultRangeDays - 1));
  return [start, end];
}
