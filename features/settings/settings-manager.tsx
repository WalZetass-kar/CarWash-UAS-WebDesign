"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { AppSettings } from "@/lib/data";

export function SettingsManager({ initialSettings }: { initialSettings: AppSettings }) {
  const router = useRouter();
  const csrfFetch = useCsrfFetch();
  const [form, setForm] = useState(initialSettings);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await csrfFetch("/api/settings", {
      method: "PUT",
      body: JSON.stringify({
        businessName: form.businessName,
        businessPhone: form.businessPhone,
        businessAddress: form.businessAddress,
        queueSlotCapacity: form.queueSlotCapacity,
        reportDefaultRangeDays: form.reportDefaultRangeDays,
        autoPrintInvoice: form.autoPrintInvoice,
        invoiceFooter: form.invoiceFooter,
      }),
    });

    setSaving(false);
    if (!response.ok) {
      toast.error("Gagal menyimpan pengaturan");
      return;
    }

    const saved = await response.json();
    setForm(saved);
    router.refresh();
    toast.success("Pengaturan sistem diperbarui");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Operasional</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama bisnis</Label>
              <Input
                value={form.businessName}
                onChange={(event) => setForm({ ...form, businessName: event.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Telepon bisnis</Label>
                <Input
                  value={form.businessPhone}
                  onChange={(event) => setForm({ ...form, businessPhone: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kapasitas antrian per jam</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={form.queueSlotCapacity}
                  onChange={(event) =>
                    setForm({ ...form, queueSlotCapacity: Number(event.target.value) || 1 })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat bisnis</Label>
              <textarea
                className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.businessAddress}
                onChange={(event) => setForm({ ...form, businessAddress: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan footer invoice</Label>
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.invoiceFooter}
                onChange={(event) => setForm({ ...form, invoiceFooter: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Default range laporan (hari)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={form.reportDefaultRangeDays}
                onChange={(event) =>
                  setForm({ ...form, reportDefaultRangeDays: Number(event.target.value) || 1 })
                }
                required
              />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <input
                type="checkbox"
                checked={form.autoPrintInvoice}
                onChange={(event) => setForm({ ...form, autoPrintInvoice: event.target.checked })}
                className="size-4 shrink-0"
              />
              Cetak invoice otomatis setelah pembayaran berhasil
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="font-semibold">{form.businessName}</div>
              <div className="mt-1 text-slate-500 dark:text-slate-400">{form.businessPhone || "-"}</div>
              <div className="mt-2 break-words text-slate-600 dark:text-slate-300">{form.businessAddress || "-"}</div>
              <div className="mt-3 text-slate-500 dark:text-slate-400">
                Laporan default {form.reportDefaultRangeDays} hari, slot {form.queueSlotCapacity} antrian per jam.
              </div>
            </div>
            <Button className="w-full" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
