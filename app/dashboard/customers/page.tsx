import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { BackendSetupNotice } from "@/components/runtime/backend-setup-notice";
import { CustomerManager } from "@/features/customers/customer-manager";
import { requireSession } from "@/lib/auth/session";
import { listCustomers } from "@/services/customers";

export const metadata = {
  title: "Data Pelanggan",
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; highlight?: string }>;
}) {
  await connection();
  const session = await requireSession();
  const params = await searchParams;
  const customers = await loadCustomersData();
  if (!customers) return <BackendSetupNotice area="dashboard" compact issue="connection-error" />;

  return (
    <div className="space-y-6">
      <div>
        <Badge>CRUD Pelanggan</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Data Pelanggan</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Kelola pelanggan, kendaraan, catatan, pencarian, sorting, dan pagination.
        </p>
      </div>
      <CustomerManager
        initialData={customers}
        role={session.user.role}
        initialSearch={params.query ?? ""}
        highlightedId={params.highlight ?? ""}
      />
    </div>
  );
}

async function loadCustomersData() {
  try {
    return JSON.parse(JSON.stringify(await listCustomers()));
  } catch (error) {
    console.error("Failed to load customers page data", error);
    return null;
  }
}
