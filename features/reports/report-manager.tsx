"use client";

import { useMemo, useState } from "react";
import Flatpickr from "react-flatpickr";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import type { Payment } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/constants";
import { MonthlyLineChart, PaymentPieChart } from "@/features/dashboard/charts";

export function ReportManager({
  payments,
  monthlyRevenue,
  popularPackage,
}: {
  payments: Payment[];
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  popularPackage: string;
}) {
  const [range, setRange] = useState<Date[]>([]);
  const filtered = useMemo(() => {
    if (range.length < 2) return payments;
    const [from, to] = range;
    return payments.filter((payment) => {
      const date = new Date(payment.createdAt);
      return date >= from && date <= to;
    });
  }, [payments, range]);
  const paid = filtered.filter((payment) => payment.status === "lunas");
  const total = paid.reduce((sum, payment) => sum + Number(payment.amount), 0);

  function exportCsv() {
    window.location.href = `/api/reports?format=csv${buildRangeParams(range)}`;
  }

  function exportPdf() {
    window.location.href = `/api/reports?format=pdf${buildRangeParams(range)}`;
  }

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      { accessorKey: "queueNumber", header: "Invoice" },
      { accessorKey: "customerName", header: "Pelanggan" },
      {
        accessorKey: "method",
        header: "Metode",
        cell: ({ row }) => paymentMethodLabels[row.original.method],
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => paymentStatusLabels[row.original.status],
      },
      {
        accessorKey: "amount",
        header: "Total",
        cell: ({ row }) => formatCurrency(row.original.amount),
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
            <div className="flex flex-wrap gap-2">
              <Flatpickr
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={range}
                options={{ mode: "range", dateFormat: "Y-m-d" }}
                onChange={setRange}
                placeholder="Filter tanggal"
              />
              <Button variant="outline" onClick={exportCsv}>
                <Download className="size-4" />
                CSV
              </Button>
              <Button onClick={exportPdf}>
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
            <CardTitle>Pendapatan Bulanan</CardTitle>
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
  return `&from=${from.toISOString()}&to=${to.toISOString()}`;
}
