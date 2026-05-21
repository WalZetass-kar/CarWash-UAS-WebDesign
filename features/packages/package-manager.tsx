"use client";

/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageIcon, PackagePlus, Pencil, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { getFormErrors, getResponseMessage, type FormErrors } from "@/lib/form-utils";
import type { WashPackage } from "@/lib/data";
import type { Role } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { packageSchema } from "@/schemas/package";

const initialForm = {
  name: "",
  description: "",
  price: "35000",
  estimatedMinutes: "30",
  imageUrl: "",
  isActive: true,
};

export function PackageManager({
  initialData,
  role,
}: {
  initialData: WashPackage[];
  role: Role;
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<WashPackage[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activePackages = useMemo(() => data.filter((item) => item.isActive).length, [data]);
  const inactivePackages = data.length - activePackages;

  function resetForm() {
    setForm(initialForm);
    setErrors({});
    setEditingId(null);
  }

  function openCreateModal() {
    if (role !== "admin") {
      toast.error("Hanya admin yang dapat mengelola paket pencucian");
      return;
    }
    resetForm();
    setOpen(true);
  }

  function openEditModal(washPackage: WashPackage) {
    if (role !== "admin") {
      toast.error("Hanya admin yang dapat mengelola paket pencucian");
      return;
    }

    setEditingId(washPackage.id);
    setErrors({});
    setForm({
      name: washPackage.name,
      description: washPackage.description,
      price: String(washPackage.price),
      estimatedMinutes: String(washPackage.estimatedMinutes),
      imageUrl: washPackage.imageUrl ?? "",
      isActive: washPackage.isActive,
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    resetForm();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role !== "admin") {
      toast.error("Hanya admin yang dapat mengelola paket pencucian");
      return;
    }

    const parsed = packageSchema.safeParse({
      ...form,
      price: Number(form.price),
      estimatedMinutes: Number(form.estimatedMinutes),
      imageUrl: form.imageUrl,
    });

    if (!parsed.success) {
      setErrors(getFormErrors(parsed.error));
      toast.error("Periksa kembali form paket pencucian");
      return;
    }

    setSubmitting(true);
    setErrors({});

    if (editingId) {
      const previous = data;
      const optimistic: WashPackage = {
        id: editingId,
        ...parsed.data,
        createdAt: data.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString(),
      };

      setData((items) => items.map((item) => (item.id === editingId ? optimistic : item)));
      const response = await csrfFetch(`/api/packages/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      });
      setSubmitting(false);

      if (!response.ok) {
        setData(previous);
        toast.error(await getResponseMessage(response, "Gagal memperbarui paket"));
        return;
      }

      const saved = await response.json();
      setData((items) => items.map((item) => (item.id === editingId ? saved : item)));
      toast.success("Paket berhasil diperbarui");
      closeModal();
      return;
    }

    const optimistic: WashPackage = {
      id: crypto.randomUUID(),
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };
    setData((items) => [optimistic, ...items]);

    const response = await csrfFetch("/api/packages", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSubmitting(false);

    if (!response.ok) {
      setData((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error(await getResponseMessage(response, "Gagal menambah paket"));
      return;
    }

    const created = await response.json();
    setData((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
    toast.success("Paket berhasil ditambahkan");
    closeModal();
  }

  async function remove(id: string) {
    if (role !== "admin") {
      toast.error("Hanya admin yang dapat menghapus paket");
      return;
    }

    setDeletingId(id);
    const previous = data;
    setData((items) => items.filter((item) => item.id !== id));
    const response = await csrfFetch(`/api/packages/${id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!response.ok) {
      setData(previous);
      toast.error(await getResponseMessage(response, "Gagal menghapus paket"));
      return;
    }

    toast.success("Paket berhasil dihapus");
  }

  const columns: ColumnDef<WashPackage>[] = [
    {
      accessorKey: "name",
      header: "Paket",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            {row.original.imageUrl ? (
              <img src={row.original.imageUrl} alt={row.original.name} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="size-4 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-semibold">{row.original.name}</div>
            <div className="mt-1 text-xs text-slate-500">{row.original.description}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Harga",
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      accessorKey: "estimatedMinutes",
      header: "Durasi",
      cell: ({ row }) => `${row.original.estimatedMinutes} menit`,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "success" : "secondary"}>
          {row.original.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Dibuat",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) =>
        role === "admin" ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditModal(row.original)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => remove(row.original.id)}
              disabled={deletingId === row.original.id}
            >
              <Trash2 className="size-4" />
              Hapus
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Read only</span>
        ),
    },
  ];

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-slate-200/70 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-cyan-600" />
              Paket Pencucian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
              <div className="text-sm text-emerald-700 dark:text-emerald-200">Paket aktif</div>
              <div className="mt-2 text-3xl font-semibold text-emerald-800 dark:text-emerald-100">{activePackages}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="text-sm text-slate-500 dark:text-slate-400">Paket nonaktif</div>
              <div className="mt-2 text-2xl font-semibold">{inactivePackages}</div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-4 text-cyan-600" />
                <div>
                  Harga, durasi, status aktif, dan gambar paket dapat diperbarui tanpa mengubah alur halaman existing.
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={openCreateModal} disabled={role !== "admin"}>
              <PackagePlus className="size-4" />
              Tambah Paket
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Data Paket Pencucian</CardTitle>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pencarian tetap tersedia, dan aksi kelola dilakukan lewat modal yang lebih aman dan responsif.
                </p>
              </div>
              <Badge variant="secondary">{data.length} Paket</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={data} searchPlaceholder="Cari nama paket, deskripsi, atau harga..." />
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? setOpen(nextOpen) : closeModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Paket Pencucian" : "Tambah Paket Pencucian"}</DialogTitle>
            <DialogDescription>
              Lengkapi nama paket, harga, durasi, deskripsi, dan gambar opsional agar tampil lebih profesional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-2">
                <Label htmlFor="package-name">Nama paket</Label>
                <Input
                  id="package-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  aria-invalid={Boolean(errors.name)}
                />
                <FieldError message={errors.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-image">URL gambar opsional</Label>
                <Input
                  id="package-image"
                  value={form.imageUrl}
                  onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                  placeholder="https://..."
                  aria-invalid={Boolean(errors.imageUrl)}
                />
                <FieldError message={errors.imageUrl} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-description">Deskripsi</Label>
              <Textarea
                id="package-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                aria-invalid={Boolean(errors.description)}
              />
              <FieldError message={errors.description} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="package-price">Harga</Label>
                <Input
                  id="package-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  aria-invalid={Boolean(errors.price)}
                />
                <FieldError message={errors.price} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="package-duration">Durasi</Label>
                <Input
                  id="package-duration"
                  type="number"
                  min={5}
                  value={form.estimatedMinutes}
                  onChange={(event) => setForm((current) => ({ ...current, estimatedMinutes: event.target.value }))}
                  aria-invalid={Boolean(errors.estimatedMinutes)}
                />
                <FieldError message={errors.estimatedMinutes} />
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm dark:border-slate-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Paket aktif dan bisa dipilih di antrian
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Preview Singkat
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid size-14 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt={form.name || "Preview paket"} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="size-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{form.name || "Nama paket"}</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {form.price ? formatCurrency(Number(form.price)) : formatCurrency(0)} • {form.estimatedMinutes || 0} menit
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                <PackagePlus className="size-4" />
                {editingId ? "Simpan Perubahan" : "Tambah Paket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
