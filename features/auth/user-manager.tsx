"use client";

import { FormEvent, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, Pencil, UserRoundPlus, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";
import { getFormErrors, getResponseMessage, type FormErrors } from "@/lib/form-utils";
import type { User } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { roleLabels } from "@/lib/constants";
import { userFormSchema } from "@/schemas/auth";

const initialForm = {
  name: "",
  email: "",
  password: "kasir123",
  role: "kasir",
  isActive: true,
};

export function UserManager({ initialData }: { initialData: User[] }) {
  const csrfFetch = useCsrfFetch();
  const [data, setData] = useState<User[]>(initialData);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = userFormSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(getFormErrors(parsed.error));
      toast.error("Periksa kembali form user");
      return;
    }

    setSaving(true);
    setErrors({});

    if (editingId) {
      const previous = data;
      const updated: User = {
        id: editingId,
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        createdAt: data.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString(),
      };
      setData((items) => items.map((item) => (item.id === editingId ? updated : item)));
      const response = await csrfFetch(`/api/users/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      });
      setSaving(false);

      if (!response.ok) {
        setData(previous);
        toast.error(await getResponseMessage(response, "Gagal memperbarui user"));
        return;
      }

      const saved = await response.json();
      setData((items) => items.map((item) => (item.id === editingId ? saved : item)));
      setEditingId(null);
      setForm(initialForm);
      toast.success(parsed.data.password ? "User dan password berhasil diperbarui" : "User berhasil diperbarui");
      return;
    }

    const optimistic: User = {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      createdAt: new Date().toISOString(),
    };
    setData((items) => [optimistic, ...items]);

    const response = await csrfFetch("/api/users", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!response.ok) {
      setData((items) => items.filter((item) => item.id !== optimistic.id));
      toast.error(await getResponseMessage(response, "Gagal menambah user"));
      return;
    }

    const created = await response.json();
    setData((items) => items.map((item) => (item.id === optimistic.id ? created : item)));
    setForm(initialForm);
    toast.success("User berhasil ditambahkan");
  }

  function startEdit(user: User) {
    setEditingId(user.id);
    setErrors({});
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
    setErrors({});
    setForm(initialForm);
  }

  async function deactivate(id: string) {
    const previous = data;
    setData((items) => items.map((item) => (item.id === id ? { ...item, isActive: false } : item)));
    const response = await csrfFetch(`/api/users/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setData(previous);
      toast.error(await getResponseMessage(response, "Gagal menonaktifkan user"));
      return;
    }
    toast.success("User berhasil dinonaktifkan");
  }

  const columns: ColumnDef<User>[] = [
    { accessorKey: "name", header: "Nama" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <Badge>{roleLabels[row.original.role]}</Badge>,
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
        <div className="flex flex-wrap gap-2">
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
              <Label htmlFor="user-name">Nama</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                aria-invalid={Boolean(errors.name)}
              />
              <FieldError message={errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                aria-invalid={Boolean(errors.email)}
              />
              <FieldError message={errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">{editingId ? "Password baru (opsional)" : "Password awal"}</Label>
              <Input
                id="user-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                aria-invalid={Boolean(errors.password)}
              />
              <FieldError message={errors.password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <NativeSelect
                id="user-role"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="admin">Admin</option>
                <option value="kasir">Kasir</option>
                <option value="staff">Staff</option>
                <option value="petugas">Petugas (Legacy)</option>
              </NativeSelect>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm dark:border-slate-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              User aktif
            </label>

            <Button className="w-full" disabled={saving}>
              <UserRoundPlus className="size-4" />
              {editingId ? "Simpan Perubahan" : "Simpan User"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manajemen User</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={data} searchPlaceholder="Cari user, email, atau role..." />
        </CardContent>
      </Card>
    </div>
  );
}
