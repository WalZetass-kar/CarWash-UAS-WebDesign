import { Badge } from "@/components/ui/badge";
import { UserManager } from "@/features/auth/user-manager";
import { requireRole } from "@/lib/auth/session";
import { listUsers } from "@/services/users";

export const metadata = {
  title: "Manajemen User",
};

export default async function UsersPage() {
  await requireRole(["admin"]);
  const users = JSON.parse(JSON.stringify(await listUsers()));

  return (
    <div className="space-y-6">
      <div>
        <Badge>RBAC Admin</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Manajemen User</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Tambah user, atur role, nonaktifkan user, reset password, search, sorting, dan pagination.
        </p>
      </div>
      <UserManager initialData={users} />
    </div>
  );
}
