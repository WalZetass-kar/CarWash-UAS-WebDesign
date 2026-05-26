"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { VehicleType, WashPackage } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

type BookingSuccess = {
  customerName: string;
  licensePlate: string;
  packageName: string;
  queueNumber: string;
  scheduledAt: string;
  total: number;
  status: string;
};

const vehicleTypes: VehicleType[] = ["mobil", "motor", "suv", "pickup", "van"];

export function PublicBookingForm({
  packages,
  brandName,
  initialPackageId,
}: {
  packages: WashPackage[];
  brandName: string;
  initialPackageId?: string;
}) {
  const csrfFetch = useCsrfFetch();
  const initialPackage = packages.find((item) => item.id === initialPackageId) ?? packages[0];
  const [form, setForm] = useState({
    name: "",
    phone: "",
    licensePlate: "",
    vehicleType: "mobil" as VehicleType,
    packageId: initialPackage?.id ?? "",
    scheduledAt: getDefaultSchedule(),
    notes: "",
  });
  const [success, setSuccess] = useState<BookingSuccess | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === form.packageId) ?? packages[0],
    [form.packageId, packages],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await csrfFetch("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        vehicleType: form.vehicleType,
        licensePlate: form.licensePlate.toUpperCase(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        notes: form.notes || null,
      }),
    });

    setSubmitting(false);
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.message ?? "Gagal membuat booking");
      return;
    }

    setSuccess(payload.booking as BookingSuccess);
    toast.success("Booking berhasil dibuat");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge>Publik</Badge>
              <CardTitle className="mt-3 text-2xl">Booking Tanpa Login</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Kembali
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                <div>
                  <h2 className="font-semibold text-emerald-800 dark:text-emerald-200">Booking berhasil dibuat</h2>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                    Simpan nomor antrian berikut untuk datang sesuai jadwal.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 rounded-lg border border-emerald-200 bg-white p-4 text-sm dark:border-emerald-500/20 dark:bg-slate-950/40">
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>No. antrian</span><strong className="break-words sm:text-right">{success.queueNumber}</strong></div>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Nama</span><strong className="break-words sm:text-right">{success.customerName}</strong></div>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Plat</span><strong className="break-words sm:text-right">{success.licensePlate}</strong></div>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Paket</span><strong className="break-words sm:text-right">{success.packageName}</strong></div>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"><span>Jadwal</span><strong className="break-words sm:text-right">{formatDate(success.scheduledAt)}</strong></div>
                <div className="grid gap-1 border-t border-emerald-100 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4 dark:border-emerald-500/20"><span>Total</span><strong className="break-words sm:text-right">{formatCurrency(success.total)}</strong></div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => setSuccess(null)}
                  variant="outline"
                  className="border-emerald-300 bg-transparent text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/10"
                >
                  Booking Lagi
                </Button>
                <Button asChild>
                  <Link href="/">Kembali ke Beranda</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama pelanggan</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nomor HP</Label>
                  <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Plat nomor</Label>
                  <Input
                    value={form.licensePlate}
                    onChange={(event) => setForm({ ...form, licensePlate: event.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Jenis kendaraan</Label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                    value={form.vehicleType}
                    onChange={(event) => setForm({ ...form, vehicleType: event.target.value as VehicleType })}
                  >
                    {vehicleTypes.map((item) => (
                      <option key={item} value={item}>
                        {item.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Pilih paket</Label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
                    value={form.packageId}
                    onChange={(event) => setForm({ ...form, packageId: event.target.value })}
                    required
                  >
                    {packages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {formatCurrency(item.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jadwal kedatangan</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  min={getMinSchedule()}
                  onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Catatan tambahan</Label>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:text-sm dark:border-slate-800 dark:bg-slate-950"
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Contoh: interior perlu vacuum ekstra"
                />
              </div>
              <Button className="w-full" disabled={submitting || !selectedPackage}>
                <CalendarClock className="size-4" />
                {submitting ? "Memproses Booking..." : "Konfirmasi Booking"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{brandName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPackage ? (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/10">
                <div className="font-semibold text-cyan-800 dark:text-cyan-200">{selectedPackage.name}</div>
                <div className="mt-1 text-sm text-cyan-700 dark:text-cyan-300">
                  {selectedPackage.description}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span>Estimasi</span>
                  <strong>{selectedPackage.estimatedMinutes} menit</strong>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span>Harga</span>
                  <strong>{formatCurrency(selectedPackage.price)}</strong>
                </div>
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="size-4 text-emerald-500" />
                Data booking aman
              </div>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Booking publik hanya membuat data pelanggan dan nomor antrian. Login dashboard tetap khusus admin/petugas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getDefaultSchedule() {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return formatDateTimeLocal(date);
}

function getMinSchedule() {
  return formatDateTimeLocal(new Date());
}

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
