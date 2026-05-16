"use client";

import { FormEvent, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Pencil, UserRoundPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import type { User } from "@/lib/data";
import { formatDate } from "@/lib/utils";

const initialForm = {
  name: "",
  email: "",
  password: "password123",
  role: "petugas",
  isActive: true,
};

export function UserManager({ initialData }: { initialData: User[] }) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<User[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId && !form.password) {
      toast.error("Password awal wajib diisi");
      return;
    }

    if (editingId) {
      const previous = data;
      const updated: User = {
        id: editingId,
        name: form.name,
        email: form.email,
        role: form.role as User["role"],
        isActive: form.isActive,
        createdAt: data.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString(),
      };
      setData((items) => items.map((item) => (item.id === editingId ? updated : item)));
      const response = await csrfFetch(`/api/users/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setData(previous);
        toast.error("Gagal memperbarui user");
        return;
      }

      const saved = await response.json();
      setData((items) => items.map((item) => (item.id === editingId ? saved : item)));
      setEditingId(null);
      setForm(initialForm);
      toast.success(form.password ? "User dan password diperbarui" : "User diperbarui");
      return;
    }

    const optimistic: User = {
      id: crypto.randomUUID(),
      name: form.name,
      email: form.email,
      role: form.role as User["role"],
      isActive: form.isActive,
      createdAt: new Date().toISOString(),
    };
    setData((items) => [optimistic, ...items]);

    const response = await csrfFetch("/api/users", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setData((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error("Gagal menambah user");
      return;
    }

    const created = await response.json();
    setData((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
    setForm(initialForm);
    toast.success("User ditambahkan");
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function deactivate(id: string) {
    const previous = data;
    setData((items) => items.map((item) => (item.id === id ? { ...item, isActive: false } : item)));
    const response = await csrfFetch(`/api/users/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setData(previous);
      toast.error("Gagal menonaktifkan user");
      return;
    }
    toast.success("User dinonaktifkan");
  }

  const columns: ColumnDef<User>[] = [
      { accessorKey: "name", header: "Nama" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <Badge>{row.original.role === "admin" ? "Admin" : "Petugas"}</Badge>,
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
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => startEdit(row.original)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => deactivate(row.original.id)} disabled={!row.original.isActive}>
              <KeyRound className="size-4" />
              Nonaktifkan
            </Button>
          </div>
        ),
      },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{editingId ? "Edit / Reset User" : "Tambah User"}</CardTitle>
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
              <Label>Nama</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{editingId ? "Password baru (opsional)" : "Password awal"}</Label>
              <Input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editingId} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="admin">Admin</option>
                <option value="petugas">Petugas/Kasir</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              User aktif
            </label>
            <Button className="w-full">
              <UserRoundPlus className="size-4" />
              {editingId ? "Update User" : "Simpan User"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manajemen User</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} searchPlaceholder="Cari user atau role..." />
        </CardContent>
      </Card>
    </div>
  );
}
