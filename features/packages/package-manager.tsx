"use client";

import { FormEvent, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PackagePlus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { WashPackage } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

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
}: {
  initialData: WashPackage[];
  role: "admin" | "petugas";
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<WashPackage[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

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
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => startEdit(row.original)}>
                <Pencil className="size-4 text-cyan-700" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(row.original.id)}>
                <Trash2 className="size-4 text-rose-600" />
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
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{editingId ? "Edit Paket" : "Tambah Paket"}</CardTitle>
            {editingId ? (
              <Button type="button" variant="ghost" size="icon" onClick={cancelEdit}>
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama paket</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} disabled={role !== "admin"} required />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} disabled={role !== "admin"} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
        <CardHeader>
          <CardTitle>Data Paket Pencucian</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} searchPlaceholder="Cari paket..." />
        </CardContent>
      </Card>
    </div>
  );
}
