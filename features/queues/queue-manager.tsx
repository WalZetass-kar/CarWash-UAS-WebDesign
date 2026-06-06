"use client";

import { FormEvent, useEffect, useState } from "react";
import Flatpickr from "react-flatpickr";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/tables/data-table";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { Customer, QueueItem, WashPackage } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { queueStatusLabels, type QueueStatus } from "@/lib/constants";

const statusVariant: Record<QueueStatus, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  menunggu: "warning",
  antrian: "warning",
  sedang_dicuci: "default",
  interior_cleaning: "default",
  finishing: "default",
  diproses: "default",
  selesai: "success",
  dibatalkan: "destructive",
};

export function QueueManager({
  initialQueues,
  customers,
  packages,
  initialSearch,
  highlightedId,
}: {
  initialQueues: QueueItem[];
  customers: Customer[];
  packages: WashPackage[];
  initialSearch?: string;
  highlightedId?: string;
}) {
  const csrfFetch = useCsrfFetch();
  const [queues, setQueues] = useState<QueueItem[]>(initialQueues);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [discount, setDiscount] = useState(0);
  const [scheduledAt, setScheduledAt] = useState<Date[]>([new Date()]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      const response = await fetch("/api/queues");
      if (response.ok) setQueues(await response.json());
    };
    window.addEventListener("cleanride:queue-updated", refresh);
    return () => window.removeEventListener("cleanride:queue-updated", refresh);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const customer = customers.find((item) => item.id === customerId) ?? customers[0];
    const washPackage = packages.find((item) => item.id === packageId) ?? packages[0];
    if (!customer || !washPackage) {
      toast.error("Pelanggan dan paket wajib tersedia");
      return;
    }
    if (discount > washPackage.price) {
      toast.error("Diskon tidak boleh lebih besar dari harga paket");
      return;
    }
    const total = washPackage.price - discount;

    const optimistic: QueueItem = {
      id: crypto.randomUUID(),
      queueNumber: `CR-${String(queues.length + 1).padStart(3, "0")}`,
      customerId,
      packageId,
      customerName: customer.name,
      packageName: washPackage.name,
      licensePlate: customer.licensePlate,
      scheduledAt: scheduledAt[0]?.toISOString() ?? new Date().toISOString(),
      status: "menunggu",
      total,
      createdAt: new Date().toISOString(),
    };
    setQueues((items) => [optimistic, ...items]);

    const response = await csrfFetch("/api/queues", {
      method: "POST",
      body: JSON.stringify({
        customerId,
        packageId,
        scheduledAt: optimistic.scheduledAt,
        status: "menunggu",
        discount,
      }),
    });

    if (!response.ok) {
      setQueues((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error("Gagal membuat antrian");
      return;
    }

    setFormOpen(false);
    setDiscount(0);
    toast.success("Antrian dibuat");
  }

  async function updateStatus(id: string, status: QueueItem["status"]) {
    const previous = queues;
    setQueues((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    const response = await csrfFetch(`/api/queues/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setQueues(previous);
      toast.error("Gagal memperbarui status");
      return;
    }
    toast.success("Status antrian diperbarui");
  }

  const columns: ColumnDef<QueueItem>[] = [
    { accessorKey: "queueNumber", header: "No Antrian" },
    { accessorKey: "customerName", header: "Pelanggan" },
    { accessorKey: "licensePlate", header: "Plat" },
    { accessorKey: "packageName", header: "Paket" },
    {
      accessorKey: "scheduledAt",
      header: "Jadwal",
      cell: ({ row }) => formatDate(row.original.scheduledAt),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => formatCurrency(row.original.total),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>
          {queueStatusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Update",
      cell: ({ row }) => (
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
          value={row.original.status}
          onChange={(event) => updateStatus(row.original.id, event.target.value as QueueItem["status"])}
        >
          {Object.entries(queueStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Riwayat Antrian</CardTitle>
            <Badge variant="success">
              <CheckCircle2 className="mr-1 size-3" />
              <span className="sm:hidden">Live</span>
              <span className="hidden sm:inline">Realtime Ready</span>
            </Badge>
          </div>
          <Button type="button" onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <CalendarClock className="size-4" />
            Tambah Antrian
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <DataTable
            columns={columns}
            data={queues}
            searchPlaceholder="Cari antrian, pelanggan, status..."
            initialSearch={initialSearch}
            getRowId={(row) => row.id}
            highlightedRowId={highlightedId}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Antrian Baru</DialogTitle>
            <DialogDescription>
              Pilih pelanggan, paket, dan jadwal kedatangan untuk membuat nomor antrian baru.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pelanggan</Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.licensePlate}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Paket</Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                value={packageId}
                onChange={(event) => setPackageId(event.target.value)}
              >
                {packages.map((washPackage) => (
                  <option key={washPackage.id} value={washPackage.id}>
                    {washPackage.name} - {formatCurrency(washPackage.price)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Diskon</Label>
                <input
                  type="number"
                  min={0}
                  max={packages.find((item) => item.id === packageId)?.price ?? undefined}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                  value={discount}
                  onChange={(event) => setDiscount(Math.max(0, Number(event.target.value) || 0))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total bersih</Label>
                <div className="grid h-10 place-items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold dark:border-slate-800 dark:bg-slate-900">
                  {formatCurrency(
                    Math.max(0, (packages.find((item) => item.id === packageId)?.price ?? 0) - discount),
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tanggal & jam</Label>
              <Flatpickr
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                value={scheduledAt}
                options={{ enableTime: true, dateFormat: "Y-m-d H:i", time_24hr: true }}
                onChange={setScheduledAt}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Batal
              </Button>
              <Button>
                <CalendarClock className="size-4" />
                Buat Antrian
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
