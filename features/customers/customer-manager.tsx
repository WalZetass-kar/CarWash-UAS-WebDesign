"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CarFront, History, Pencil, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { getFormErrors, getResponseMessage, type FormErrors } from "@/lib/form-utils";
import type { Customer } from "@/lib/data";
import type { Role } from "@/lib/constants";
import { formatDate, toTitleCase } from "@/lib/utils";
import { customerSchema } from "@/schemas/customer";

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
  role: Role;
}) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<Customer[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = customerSchema.safeParse(form);

    if (!parsed.success) {
      setErrors(getFormErrors(parsed.error));
      toast.error("Periksa kembali form pelanggan");
      return;
    }

    setLoading(true);
    setErrors({});

    if (editingId) {
      const previous = data;
      const updated: Customer = {
        id: editingId,
        ...parsed.data,
        createdAt: data.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString(),
      };
      setData((items) => items.map((item) => (item.id === editingId ? updated : item)));
      const response = await csrfFetch(`/api/customers/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      });
      setLoading(false);

      if (!response.ok) {
        setData(previous);
        toast.error(await getResponseMessage(response, "Gagal memperbarui pelanggan"));
        return;
      }

      const saved = await response.json();
      setData((items) => items.map((item) => (item.id === editingId ? saved : item)));
      setForm(initialForm);
      setEditingId(null);
      toast.success("Pelanggan berhasil diperbarui");
      return;
    }

    const optimistic: Customer = {
      id: crypto.randomUUID(),
      ...parsed.data,
      createdAt: new Date().toISOString(),
    };
    setData((items) => [optimistic, ...items]);

    const response = await csrfFetch("/api/customers", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);

    if (!response.ok) {
      setData((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error(await getResponseMessage(response, "Gagal menambah pelanggan"));
      return;
    }

    const created = await response.json();
    setData((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
    setForm(initialForm);
    toast.success("Pelanggan berhasil ditambahkan");
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setErrors({});
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
    setErrors({});
    setForm(initialForm);
  }

  async function remove(id: string) {
    const previous = data;
    setData((items) => items.filter((item) => item.id !== id));
    const response = await csrfFetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setData(previous);
      toast.error(await getResponseMessage(response, "Gagal menghapus pelanggan"));
      return;
    }
    toast.success("Pelanggan berhasil dihapus");
  }

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: "Pelanggan",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.name}</div>
          <div className="mt-1 text-xs text-slate-500">{row.original.phone}</div>
        </div>
      ),
    },
    { accessorKey: "licensePlate", header: "Plat" },
    {
      accessorKey: "vehicleType",
      header: "Kendaraan",
      cell: ({ row }) => <Badge variant="secondary">{toTitleCase(row.original.vehicleType)}</Badge>,
    },
    {
      accessorKey: "notes",
      header: "Catatan",
      cell: ({ row }) => row.original.notes || <span className="text-slate-400">Tidak ada catatan</span>,
    },
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
          <Button variant="outline" size="sm" onClick={() => startEdit(row.original)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/customers/${row.original.id}`}>
              <History className="size-4" />
              Riwayat
            </Link>
          </Button>
          {role === "admin" ? (
            <Button variant="outline" size="sm" onClick={() => remove(row.original.id)}>
              <Trash2 className="size-4" />
              Hapus
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
              <Label htmlFor="customer-name">Nama pelanggan</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError message={errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">Nomor HP</Label>
              <Input
                id="customer-phone"
                inputMode="numeric"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value.replace(/\D/g, "") }))
                }
                aria-invalid={Boolean(errors.phone)}
              />
              <FieldError message={errors.phone} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-plate">Plat nomor</Label>
              <Input
                id="customer-plate"
                value={form.licensePlate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, licensePlate: event.target.value.toUpperCase() }))
                }
                aria-invalid={Boolean(errors.licensePlate)}
              />
              <FieldError message={errors.licensePlate} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-vehicle">Jenis kendaraan</Label>
              <NativeSelect
                id="customer-vehicle"
                value={form.vehicleType}
                onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value }))}
              >
                {["mobil", "motor", "suv", "pickup", "van"].map((item) => (
                  <option key={item} value={item}>
                    {toTitleCase(item)}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-notes">Catatan</Label>
              <Textarea
                id="customer-notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Kebutuhan khusus interior, langganan, atau catatan kendaraan"
                aria-invalid={Boolean(errors.notes)}
              />
              <FieldError message={errors.notes} />
            </div>

            <Button className="w-full" disabled={loading}>
              <UserPlus className="size-4" />
              {editingId ? "Simpan Perubahan" : "Simpan Pelanggan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Data Pelanggan</CardTitle>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search pelanggan dan plat kendaraan tetap ringan, plus akses cepat ke histori transaksi pelanggan.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              <CarFront className="mr-1 size-3" />
              {data.length} Pelanggan
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            searchPlaceholder="Cari nama pelanggan, nomor HP, atau plat kendaraan..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
