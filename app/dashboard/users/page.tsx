import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { UserManager } from "@/features/auth/user-manager";
import { requireRole } from "@/lib/auth/session";
import { loadWithTimeoutFallback } from "@/lib/runtime/load-with-timeout";
import { listUsers } from "@/services/users";

export const metadata = {
  title: "Manajemen User",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; highlight?: string }>;
}) {
  await connection();
  await requireRole(["admin"]);
  const params = await searchParams;
  const users = await loadUsersData();

  return (
    <div className="space-y-6">
      <div>
        <Badge>RBAC Admin</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Manajemen User</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Tambah user, atur role, nonaktifkan user, reset password, search, sorting, dan pagination.
        </p>
      </div>
      <UserManager
        initialData={users}
        initialSearch={params.query ?? ""}
        highlightedId={params.highlight ?? ""}
      />
    </div>
  );
}

async function loadUsersData() {
  try {
    const users = await loadWithTimeoutFallback(() => listUsers(), {
      fallback: () => [],
      label: "users page data",
      timeoutMs: 2500,
    });
    return JSON.parse(JSON.stringify(users));
  } catch (error) {
    console.error("Failed to load users page data", error);
    return [];
  }
}
