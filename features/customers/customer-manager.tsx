"use client";

import { FormEvent, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { Customer, Role } from "@/lib/data";
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
  initialSearch,
  highlightedId,
}: {
  initialData: Customer[];
  role: Role;
  initialSearch?: string;
  highlightedId?: string;
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<Customer[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

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
      resetForm();
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
    resetForm();
    toast.success("Pelanggan ditambahkan");
  }

  function startCreate() {
    setEditingId(null);
    setForm(initialForm);
    setFormOpen(true);
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setFormOpen(true);
    setForm({
      name: customer.name,
      phone: customer.phone,
      licensePlate: customer.licensePlate,
      vehicleType: customer.vehicleType,
      notes: customer.notes ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
    setFormOpen(false);
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startEdit(row.original)}
            aria-label={`Edit pelanggan ${row.original.name}`}
            className="w-full justify-center sm:h-10 sm:w-10 sm:px-0"
          >
            <Pencil className="size-4 text-cyan-700" />
            <span className="sm:hidden">Edit</span>
          </Button>
          {role === "admin" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => remove(row.original.id)}
              aria-label={`Hapus pelanggan ${row.original.name}`}
              className="w-full justify-center sm:h-10 sm:w-10 sm:px-0"
            >
              <Trash2 className="size-4 text-rose-600" />
              <span className="sm:hidden">Hapus</span>
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <CardTitle>Data Pelanggan</CardTitle>
          <Button type="button" onClick={startCreate} className="w-full sm:w-auto">
            <UserPlus className="size-4" />
            Tambah Pelanggan
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Cari nama, no HP, plat..."
            initialSearch={initialSearch}
            getRowId={(row) => row.id}
            highlightedRowId={highlightedId}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : resetForm())}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Pelanggan" : "Tambah Pelanggan"}</DialogTitle>
            <DialogDescription>
              Isi data pelanggan dan kendaraan. Form ini dibuka sebagai popup agar tabel tetap lega.
            </DialogDescription>
          </DialogHeader>
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
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base dark:border-slate-800 dark:bg-slate-950 sm:text-sm"
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
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 sm:text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Batal
              </Button>
              <Button disabled={loading}>
                <UserPlus className="size-4" />
                {editingId ? "Update Pelanggan" : "Simpan Pelanggan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
