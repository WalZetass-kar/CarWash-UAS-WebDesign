"use client";

import { FormEvent, useEffect, useState } from "react";
import Flatpickr from "react-flatpickr";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { Customer, QueueItem, WashPackage } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { queueStatusLabels } from "@/lib/constants";

const statusVariant = {
  menunggu: "warning",
  diproses: "default",
  selesai: "success",
  dibatalkan: "destructive",
} as const;

export function QueueManager({
  initialQueues,
  customers,
  packages,
}: {
  initialQueues: QueueItem[];
  customers: Customer[];
  packages: WashPackage[];
}) {
  const csrfFetch = useCsrfFetch();
  const [queues, setQueues] = useState<QueueItem[]>(initialQueues);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState<Date[]>([new Date()]);

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
      total: washPackage.price,
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
      }),
    });

    if (!response.ok) {
      setQueues((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error("Gagal membuat antrian");
      return;
    }

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
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-800 dark:bg-slate-950"
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
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Antrian Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Pelanggan</Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
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
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
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
            <div className="space-y-2">
              <Label>Tanggal & jam</Label>
              <Flatpickr
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={scheduledAt}
                options={{ enableTime: true, dateFormat: "Y-m-d H:i", time_24hr: true }}
                onChange={setScheduledAt}
              />
            </div>
            <Button className="w-full">
              <CalendarClock className="size-4" />
              Buat Antrian
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Riwayat Antrian</CardTitle>
            <Badge variant="success">
              <CheckCircle2 className="mr-1 size-3" />
              Realtime Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={queues} searchPlaceholder="Cari antrian, pelanggan, status..." />
        </CardContent>
      </Card>
    </div>
  );
}
