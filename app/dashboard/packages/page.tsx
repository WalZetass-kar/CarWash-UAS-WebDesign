import { Badge } from "@/components/ui/badge";
import { PackageManager } from "@/features/packages/package-manager";
import { requireSession } from "@/lib/auth/session";
import { listPackages } from "@/services/packages";

export const metadata = {
  title: "Paket Pencucian",
};

export default async function PackagesPage() {
  const session = await requireSession();
  const packages = JSON.parse(JSON.stringify(await listPackages()));

  return (
    <div className="space-y-6">
      <div>
        <Badge>CRUD Paket</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Data Paket Pencucian</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Admin dapat mengelola paket, harga, estimasi waktu, dan status aktif.
        </p>
      </div>
      <PackageManager initialData={packages} role={session.user.role} />
    </div>
  );
}
