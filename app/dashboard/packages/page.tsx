import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { BackendSetupNotice } from "@/components/runtime/backend-setup-notice";
import { PackageManager } from "@/features/packages/package-manager";
import { requireSession } from "@/lib/auth/session";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { listPackages } from "@/services/packages";

export const metadata = {
  title: "Paket Pencucian",
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; highlight?: string }>;
}) {
  await connection();
  const session = await requireSession();
  const params = await searchParams;
  const packages = await loadPackagesData();
  if (!packages) return <BackendSetupNotice area="dashboard" compact issue="connection-error" />;

  return (
    <div className="space-y-6">
      <div>
        <Badge>CRUD Paket</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Data Paket Pencucian</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Admin dapat mengelola paket, harga, estimasi waktu, dan status aktif.
        </p>
      </div>
      <PackageManager
        initialData={packages}
        role={session.user.role}
        initialSearch={params.query ?? ""}
        highlightedId={params.highlight ?? ""}
      />
    </div>
  );
}

async function loadPackagesData() {
  try {
    return JSON.parse(JSON.stringify(await withDatabaseRetry(() => listPackages())));
  } catch (error) {
    console.error("Failed to load packages page data", error);
    return null;
  }
}
