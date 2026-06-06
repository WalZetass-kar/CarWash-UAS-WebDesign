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
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [packageName, setPackageName] = useState("");
  const packageOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.packageName))).sort(),
    [rows],
  );
  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchesDate = (() => {
        if (range.length < 2) return true;
        const [from, to] = range;
        const dateKey = formatDateInput(row.createdAt);
        return dateKey >= formatDateInput(from) && dateKey <= formatDateInput(to);
      })();
      const matchesMethod = method ? row.method === method : true;
      const matchesStatus = status ? row.status === status : true;
      const matchesPackage = packageName ? row.packageName === packageName : true;
      return matchesDate && matchesMethod && matchesStatus && matchesPackage;
    });
  }, [rows, range, method, status, packageName]);
  const paid = filtered.filter((row) => row.status === "lunas");
  const total = paid.reduce((sum, row) => sum + Number(row.total), 0);

  function exportCsv() {
    window.location.href = `/api/reports?${buildExportParams("csv", range, method, status, packageName)}`;
  }

  function exportPdf() {
    window.location.href = `/api/reports?${buildExportParams("pdf", range, method, status, packageName)}`;
  }

  function exportXlsx() {
    window.location.href = `/api/reports?${buildExportParams("xlsx", range, method, status, packageName)}`;
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
        accessorKey: "subtotal",
        header: "Subtotal",
        cell: ({ row }) => formatCurrency(row.original.subtotal),
      },
      {
        accessorKey: "discount",
        header: "Diskon",
        cell: ({ row }) => formatCurrency(row.original.discount),
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
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:w-auto sm:text-sm"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              >
                <option value="">Semua metode</option>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:w-auto sm:text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Semua status</option>
                {Object.entries(paymentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:w-auto sm:text-sm"
                value={packageName}
                onChange={(event) => setPackageName(event.target.value)}
              >
                <option value="">Semua paket</option>
                {packageOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={exportCsv} className="w-full sm:w-auto sm:flex-none">
                <Download className="size-4" />
                CSV
              </Button>
              <Button variant="outline" onClick={exportXlsx} className="w-full sm:w-auto sm:flex-none">
                <Download className="size-4" />
                XLSX
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

function buildExportParams(
  format: "csv" | "pdf" | "xlsx",
  range: Date[],
  method: string,
  status: string,
  packageName: string,
) {
  const params = new URLSearchParams({ format });
  if (range.length >= 2) {
    const [from, to] = range;
    params.set("from", formatDateInput(from));
    params.set("to", formatDateInput(to));
  }
  if (method) params.set("method", method);
  if (status) params.set("status", status);
  if (packageName) params.set("packageName", packageName);
  return params.toString();
}

function buildDefaultRange(defaultRangeDays: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (defaultRangeDays - 1));
  return [start, end];
}
