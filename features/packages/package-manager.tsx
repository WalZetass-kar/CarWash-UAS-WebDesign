"use client";

import { FormEvent, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, PackagePlus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { Role, WashPackage } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const initialForm = {
  name: "",
  description: "",
  price: 35000,
  estimatedMinutes: 30,
  isActive: true,
};

export function PackageManager({
  initialData,
  role,
  initialSearch,
  highlightedId,
}: {
  initialData: WashPackage[];
  role: Role;
  initialSearch?: string;
  highlightedId?: string;
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<WashPackage[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role !== "admin") {
      toast.error("Petugas tidak dapat menambah paket");
      return;
    }

    if (editingId) {
      const previous = data;
      const updated: WashPackage = {
        id: editingId,
        ...form,
        createdAt: data.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString(),
      };
      setData((items) => items.map((item) => (item.id === editingId ? updated : item)));
      const response = await csrfFetch(`/api/packages/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setData(previous);
        toast.error("Gagal memperbarui paket");
        return;
      }

      const saved = await response.json();
      setData((items) => items.map((item) => (item.id === editingId ? saved : item)));
      setForm(initialForm);
      setEditingId(null);
      setFormOpen(false);
      toast.success("Paket diperbarui");
      return;
    }

    const optimistic: WashPackage = {
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date().toISOString(),
    };
    setData((items) => [optimistic, ...items]);

    const response = await csrfFetch("/api/packages", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setData((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error("Gagal menambah paket");
      return;
    }

    const created = await response.json();
    setData((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
    setForm(initialForm);
    setFormOpen(false);
    toast.success("Paket ditambahkan");
  }

  async function remove(id: string) {
    const previous = data;
    setData((items) => items.filter((item) => item.id !== id));
    const response = await csrfFetch(`/api/packages/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setData(previous);
      toast.error("Gagal menghapus paket");
      return;
    }
    toast.success("Paket dihapus");
  }

  function startEdit(washPackage: WashPackage) {
    setFormOpen(true);
    setEditingId(washPackage.id);
    setForm({
      name: washPackage.name,
      description: washPackage.description,
      price: washPackage.price,
      estimatedMinutes: washPackage.estimatedMinutes,
      isActive: washPackage.isActive,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setFormOpen(false);
  }

  const columns: ColumnDef<WashPackage>[] = [
      { accessorKey: "name", header: "Paket" },
      { accessorKey: "description", header: "Deskripsi" },
      {
        accessorKey: "price",
        header: "Harga",
        cell: ({ row }) => formatCurrency(row.original.price),
      },
      {
        accessorKey: "estimatedMinutes",
        header: "Estimasi",
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(row.original)}
                aria-label={`Edit paket ${row.original.name}`}
                className="w-full justify-center sm:h-10 sm:w-10 sm:px-0"
              >
                <Pencil className="size-4 text-cyan-700" />
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(row.original.id)}
                aria-label={`Hapus paket ${row.original.name}`}
                className="w-full justify-center sm:h-10 sm:w-10 sm:px-0"
              >
                <Trash2 className="size-4 text-rose-600" />
                <span className="sm:hidden">Hapus</span>
              </Button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Read only</span>
          ),
      },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{editingId ? "Edit Paket" : "Tambah Paket"}</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormOpen((value) => !value)}
                className="xl:hidden"
              >
                {formOpen ? "Sembunyikan" : editingId ? "Lanjut Edit" : "Buka Form"}
                <ChevronDown className={cn("transition-transform", formOpen && "rotate-180")} />
              </Button>
              {editingId ? (
                <Button type="button" variant="ghost" size="icon" onClick={cancelEdit}>
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("p-4 pt-0 sm:p-5 sm:pt-0", !formOpen && "hidden xl:block")}>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama paket</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} disabled={role !== "admin"} required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                disabled={role !== "admin"}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Harga</Label>
                <Input type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} disabled={role !== "admin"} required />
              </div>
              <div className="space-y-2">
                <Label>Menit</Label>
                <Input type="number" value={form.estimatedMinutes} onChange={(event) => setForm({ ...form, estimatedMinutes: Number(event.target.value) })} disabled={role !== "admin"} required />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                disabled={role !== "admin"}
                className="size-4 shrink-0"
              />
              Paket aktif
            </label>
            <Button className="w-full" disabled={role !== "admin"}>
              <PackagePlus className="size-4" />
              {editingId ? "Update Paket" : "Simpan Paket"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-4 sm:p-5">
          <CardTitle>Data Paket Pencucian</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Cari paket..."
            initialSearch={initialSearch}
            getRowId={(row) => row.id}
            highlightedRowId={highlightedId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
