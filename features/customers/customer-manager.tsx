"use client";

import { FormEvent, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { Customer } from "@/lib/data";
import { formatDate, toTitleCase } from "@/lib/utils";

const initialForm = {
  name: "",
  phone: "",
  licensePlate: "",
  vehicleType: "mobil",
  notes: "",
};

export function CustomerManager({
  initialData,
  role,
}: {
  initialData: Customer[];
  role: "admin" | "petugas";
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<Customer[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    if (editingId) {
      const previous = data;
      const updated: Customer = {
        id: editingId,
        name: form.name,
        phone: form.phone,
        licensePlate: form.licensePlate.toUpperCase(),
        vehicleType: form.vehicleType as Customer["vehicleType"],
        notes: form.notes,
        createdAt: data.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString(),
      };
      setData((items) => items.map((item) => (item.id === editingId ? updated : item)));
      const response = await csrfFetch(`/api/customers/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      setLoading(false);

      if (!response.ok) {
        setData(previous);
        toast.error("Gagal memperbarui pelanggan");
        return;
      }

      const saved = await response.json();
      setData((items) => items.map((item) => (item.id === editingId ? saved : item)));
      setForm(initialForm);
      setEditingId(null);
      toast.success("Pelanggan diperbarui");
      return;
    }

    const optimistic: Customer = {
      id: crypto.randomUUID(),
      name: form.name,
      phone: form.phone,
      licensePlate: form.licensePlate.toUpperCase(),
      vehicleType: form.vehicleType as Customer["vehicleType"],
      notes: form.notes,
      createdAt: new Date().toISOString(),
    };
    setData((items) => [optimistic, ...items]);

    const response = await csrfFetch("/api/customers", {
      method: "POST",
      body: JSON.stringify(optimistic),
    });
    setLoading(false);

    if (!response.ok) {
      setData((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error("Gagal menambah pelanggan");
      return;
    }

    const created = await response.json();
    setData((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
    setForm(initialForm);
    toast.success("Pelanggan ditambahkan");
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      phone: customer.phone,
      licensePlate: customer.licensePlate,
      vehicleType: customer.vehicleType,
      notes: customer.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function remove(id: string) {
    const previous = data;
    setData((items) => items.filter((item) => item.id !== id));
    const response = await csrfFetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setData(previous);
      toast.error("Gagal menghapus pelanggan");
      return;
    }
    toast.success("Pelanggan dihapus");
  }

  const columns: ColumnDef<Customer>[] = [
      { accessorKey: "name", header: "Nama" },
      { accessorKey: "phone", header: "No HP" },
      { accessorKey: "licensePlate", header: "Plat" },
      {
        accessorKey: "vehicleType",
        header: "Kendaraan",
        cell: ({ row }) => <Badge variant="secondary">{toTitleCase(row.original.vehicleType)}</Badge>,
      },
      { accessorKey: "notes", header: "Catatan" },
      {
        accessorKey: "createdAt",
        header: "Dibuat",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => startEdit(row.original)}>
              <Pencil className="size-4 text-cyan-700" />
            </Button>
            {role === "admin" ? (
            <Button variant="ghost" size="icon" onClick={() => remove(row.original.id)}>
              <Trash2 className="size-4 text-rose-600" />
            </Button>
            ) : null}
          </div>
        ),
      },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{editingId ? "Edit Pelanggan" : "Tambah Pelanggan"}</CardTitle>
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
              <Label>Nama pelanggan</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
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
            <div className="space-y-2">
              <Label>Jenis kendaraan</Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.vehicleType}
                onChange={(event) => setForm({ ...form, vehicleType: event.target.value })}
              >
                {["mobil", "motor", "suv", "pickup", "van"].map((item) => (
                  <option key={item} value={item}>
                    {toTitleCase(item)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </div>
            <Button className="w-full" disabled={loading}>
              <UserPlus className="size-4" />
              {editingId ? "Update Pelanggan" : "Simpan Pelanggan"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Data Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} searchPlaceholder="Cari nama, no HP, plat..." />
        </CardContent>
      </Card>
    </div>
  );
}
