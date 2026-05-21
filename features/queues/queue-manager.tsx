"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Flatpickr from "react-flatpickr";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarClock, CarFront, CheckCircle2, Clock3, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { getFormErrors, getResponseMessage, type FormErrors } from "@/lib/form-utils";
import type { Customer, QueueItem, WashPackage } from "@/lib/data";
import {
  normalizeQueueStatus,
  queueStatusLabels,
  queueWorkflowStatuses,
  type QueueStatus,
  type Role,
} from "@/lib/constants";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { queueSchema } from "@/schemas/queue";

const statusOptions: QueueStatus[] = [...queueWorkflowStatuses, "dibatalkan"];

const statusClasses: Record<QueueStatus, string> = {
  menunggu: "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-200",
  antrian: "bg-amber-50 text-amber-700 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-200",
  sedang_dicuci: "bg-cyan-50 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-400/10 dark:text-cyan-200",
  interior_cleaning: "bg-sky-50 text-sky-700 ring-sky-500/20 dark:bg-sky-400/10 dark:text-sky-200",
  finishing: "bg-orange-50 text-orange-700 ring-orange-500/20 dark:bg-orange-400/10 dark:text-orange-200",
  selesai: "bg-emerald-50 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-200",
  dibatalkan: "bg-rose-50 text-rose-700 ring-rose-500/20 dark:bg-rose-400/10 dark:text-rose-200",
  diproses: "bg-cyan-50 text-cyan-700 ring-cyan-500/20 dark:bg-cyan-400/10 dark:text-cyan-200",
};

export function QueueManager({
  initialQueues,
  customers,
  packages,
  role,
}: {
  initialQueues: QueueItem[];
  customers: Customer[];
  packages: WashPackage[];
  role: Role;
}) {
  const csrfFetch = useCsrfFetch();
  const [queues, setQueues] = useState<QueueItem[]>(initialQueues);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState<Date[]>([new Date()]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QueueStatus | "all">("all");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  const canCreateQueue = role === "admin" || role === "petugas";
  const canUpdateStatus = role === "admin" || role === "staff" || role === "petugas";

  const filteredQueues = useMemo(() => {
    return queues.filter((item) => {
      const normalizedSearch = search.toLowerCase();
      const comparableStatus = item.status === "diproses" ? "sedang_dicuci" : item.status;
      const matchesSearch = [item.queueNumber, item.customerName, item.licensePlate, item.packageName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesStatus = statusFilter === "all" ? true : comparableStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [queues, search, statusFilter]);

  useEffect(() => {
    const refresh = async () => {
      setRefreshing(true);
      const response = await fetch("/api/queues");
      if (response.ok) {
        setQueues(await response.json());
      }
      setRefreshing(false);
    };

    window.addEventListener("cleanride:queue-updated", refresh);
    return () => window.removeEventListener("cleanride:queue-updated", refresh);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canCreateQueue) {
      toast.error("Role ini hanya dapat memperbarui status kendaraan");
      return;
    }

    const parsed = queueSchema.safeParse({
      customerId,
      packageId,
      scheduledAt: scheduledAt[0]?.toISOString() ?? new Date().toISOString(),
      status: "menunggu",
    });

    if (!parsed.success) {
      setErrors(getFormErrors(parsed.error));
      toast.error("Periksa kembali form antrian");
      return;
    }

    const customer = customers.find((item) => item.id === customerId);
    const washPackage = packages.find((item) => item.id === packageId);
    if (!customer || !washPackage) {
      toast.error("Pelanggan dan paket wajib tersedia");
      return;
    }

    setSubmitting(true);
    setErrors({});

    const optimistic: QueueItem = {
      id: crypto.randomUUID(),
      queueNumber: `CR-${String(queues.length + 1).padStart(3, "0")}`,
      customerId,
      packageId,
      customerName: customer.name,
      packageName: washPackage.name,
      licensePlate: customer.licensePlate,
      scheduledAt: parsed.data.scheduledAt.toISOString(),
      status: "menunggu",
      total: washPackage.price,
      createdAt: new Date().toISOString(),
    };
    setQueues((items) => [optimistic, ...items]);

    const response = await csrfFetch("/api/queues", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);

    if (!response.ok) {
      setQueues((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error(await getResponseMessage(response, "Gagal membuat antrian"));
      return;
    }

    const created = await response.json();
    setQueues((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
    setScheduledAt([new Date()]);
    window.dispatchEvent(new CustomEvent("cleanride:queue-updated"));
    toast.success("Antrian berhasil dibuat");
  }

  async function updateStatus(id: string, status: QueueStatus) {
    if (!canUpdateStatus) {
      toast.error("Role ini tidak dapat memperbarui status kendaraan");
      return;
    }

    const previous = queues;
    setSavingStatusId(id);
    setQueues((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));

    const response = await csrfFetch(`/api/queues/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setSavingStatusId(null);

    if (!response.ok) {
      setQueues(previous);
      toast.error(await getResponseMessage(response, "Gagal memperbarui status kendaraan"));
      return;
    }

    const updated = await response.json();
    setQueues((items) => items.map((item) => (item.id === id ? updated : item)));
    window.dispatchEvent(new CustomEvent("cleanride:queue-updated"));
    toast.success("Status kendaraan berhasil diperbarui");
  }

  const columns: ColumnDef<QueueItem>[] = [
    { accessorKey: "queueNumber", header: "No Antrian" },
    {
      accessorKey: "customerName",
      header: "Pelanggan",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.customerName}</div>
          <div className="mt-1 text-xs text-slate-500">{row.original.licensePlate}</div>
        </div>
      ),
    },
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
      cell: ({ row }) => <QueueStatusBadge status={row.original.status} />,
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => <QueueStatusTimeline status={row.original.status} />,
    },
    {
      id: "actions",
      header: "Update",
      cell: ({ row }) =>
        canUpdateStatus ? (
          <NativeSelect
            className="min-w-40"
            value={row.original.status}
            disabled={savingStatusId === row.original.id}
            onChange={(event) => updateStatus(row.original.id, event.target.value as QueueStatus)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {queueStatusLabels[status]}
              </option>
            ))}
          </NativeSelect>
        ) : (
          <span className="text-xs text-slate-400">Read only</span>
        ),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{canCreateQueue ? "Antrian Baru" : "Panel Status Kendaraan"}</CardTitle>
            <Badge variant={canUpdateStatus ? "success" : "secondary"}>
              <CheckCircle2 className="mr-1 size-3" />
              Realtime Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {canCreateQueue ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Pelanggan</Label>
                <NativeSelect value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.licensePlate}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError message={errors.customerId} />
              </div>

              <div className="space-y-2">
                <Label>Paket</Label>
                <NativeSelect value={packageId} onChange={(event) => setPackageId(event.target.value)}>
                  {packages.map((washPackage) => (
                    <option key={washPackage.id} value={washPackage.id}>
                      {washPackage.name} - {formatCurrency(washPackage.price)}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError message={errors.packageId} />
              </div>

              <div className="space-y-2">
                <Label>Tanggal & jam</Label>
                <Flatpickr
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={scheduledAt}
                  options={{ enableTime: true, dateFormat: "Y-m-d H:i", time_24hr: true }}
                  onChange={setScheduledAt}
                />
                <FieldError message={errors.scheduledAt} />
              </div>

              <Button className="w-full" disabled={submitting || !customers.length || !packages.length}>
                <CalendarClock className="size-4" />
                Buat Antrian
              </Button>
            </form>
          ) : (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-cyan-900 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-100">
              Staff fokus pada pembaruan status kendaraan secara realtime tanpa mengubah data master atau membuat antrian baru.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <StatusSummary
              icon={Clock3}
              label="Menunggu / Antrian"
              value={queues.filter((item) => ["menunggu", "antrian"].includes(item.status)).length}
            />
            <StatusSummary
              icon={TimerReset}
              label="Sedang Proses"
              value={queues.filter((item) => !["menunggu", "antrian", "selesai", "dibatalkan"].includes(item.status)).length}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Riwayat Antrian</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search pelanggan dan plat kendaraan tetap ringan, plus filter status kendaraan tanpa reload berlebihan.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              <CarFront className="mr-1 size-3" />
              {filteredQueues.length} Kendaraan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredQueues}
            searchValue={search}
            onSearchChange={setSearch}
            isLoading={refreshing}
            searchPlaceholder="Cari no antrian, pelanggan, plat kendaraan, atau paket..."
            toolbar={
              <>
                <NativeSelect
                  className="min-w-40"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as QueueStatus | "all")}
                >
                  <option value="all">Semua status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {queueStatusLabels[status]}
                    </option>
                  ))}
                </NativeSelect>
                <Button variant="outline" size="sm" onClick={() => setStatusFilter("all")}>
                  Reset Filter
                </Button>
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function QueueStatusBadge({ status }: { status: QueueStatus }) {
  return (
    <Badge variant="secondary" className={statusClasses[status]}>
      {queueStatusLabels[status]}
    </Badge>
  );
}

function QueueStatusTimeline({ status }: { status: QueueStatus }) {
  if (status === "dibatalkan") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
        Antrian dibatalkan
      </div>
    );
  }

  const normalizedStatus = normalizeQueueStatus(status);
  const activeIndex = queueWorkflowStatuses.indexOf(normalizedStatus);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-1">
        {queueWorkflowStatuses.map((step, index) => (
          <div
            key={step}
            className={cn(
              "h-2 rounded-full transition",
              index <= activeIndex ? "bg-cyan-500 dark:bg-cyan-400" : "bg-slate-200 dark:bg-slate-800",
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
        {queueWorkflowStatuses.map((step) => (
          <span
            key={step}
            className={cn(
              "rounded-full px-2 py-0.5",
              step === normalizedStatus && "bg-cyan-50 font-semibold text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200",
            )}
          >
            {queueStatusLabels[step]}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatusSummary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Icon className="size-4 text-cyan-600" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
