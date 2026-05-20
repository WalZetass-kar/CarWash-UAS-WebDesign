"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, CreditCard, History, Sparkles, Wallet } from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queueStatusLabels } from "@/lib/constants";
import { formatCurrency, formatDate, toTitleCase } from "@/lib/utils";
import type { CustomerHistoryData, CustomerHistoryEntry } from "@/services/customer-history";
import { paymentMethodLabels, paymentStatusLabels } from "@/lib/constants";

export function CustomerHistoryView({ data }: { data: CustomerHistoryData }) {
  const columns: ColumnDef<CustomerHistoryEntry>[] = [
    { accessorKey: "queueNumber", header: "Invoice" },
    { accessorKey: "packageName", header: "Paket" },
    { accessorKey: "licensePlate", header: "Plat" },
    {
      accessorKey: "queueStatus",
      header: "Status Kendaraan",
      cell: ({ row }) => <Badge variant="secondary">{queueStatusLabels[row.original.queueStatus]}</Badge>,
    },
    {
      accessorKey: "paymentMethod",
      header: "Metode",
      cell: ({ row }) => row.original.paymentMethod ? paymentMethodLabels[row.original.paymentMethod] : "-",
    },
    {
      accessorKey: "paymentStatus",
      header: "Pembayaran",
      cell: ({ row }) => (
        <Badge variant={row.original.paymentStatus === "lunas" ? "success" : "warning"}>
          {paymentStatusLabels[row.original.paymentStatus]}
        </Badge>
      ),
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Badge>Riwayat Pelanggan</Badge>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{data.customer.name}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {data.customer.phone} • {data.customer.licensePlate} • {toTitleCase(data.customer.vehicleType)}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="size-4" />
            Kembali ke Pelanggan
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Wallet} label="Total Pengeluaran" value={formatCurrency(data.summary.totalSpent)} />
        <SummaryCard icon={History} label="Total Kunjungan" value={String(data.summary.visits)} />
        <SummaryCard icon={CreditCard} label="Kendaraan Selesai" value={String(data.summary.completed)} />
        <SummaryCard icon={Sparkles} label="Paket Favorit" value={data.summary.favoritePackage} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Histori Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data.history}
              searchPlaceholder="Cari invoice, paket, status, atau plat kendaraan..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kendaraan Pernah Dicuci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.summary.vehicles.length ? (
              data.summary.vehicles.map((vehicle) => (
                <div key={vehicle} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="font-semibold">{vehicle}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Belum ada histori kendaraan untuk pelanggan ini.
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              {data.customer.notes || "Belum ada catatan khusus untuk pelanggan ini."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <Card className="animate-rise-in">
      <CardContent className="flex items-center justify-between pt-5">
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-semibold">{value}</div>
        </div>
        <div className="grid size-11 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-900">
          <Icon className="size-5 text-cyan-600" />
        </div>
      </CardContent>
    </Card>
  );
}
