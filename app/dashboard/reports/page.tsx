import { Badge } from "@/components/ui/badge";
import { ReportManager } from "@/features/reports/report-manager";
import { requireRole } from "@/lib/auth/session";
import { getDashboardData } from "@/services/dashboard";

export const metadata = {
  title: "Laporan Transaksi",
};

export default async function ReportsPage() {
  await requireRole(["admin"]);
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <Badge>Admin Only</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Laporan Transaksi</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Filter tanggal, total pemasukan, jumlah transaksi, paket populer, export CSV dan PDF.
        </p>
      </div>
      <ReportManager
        payments={JSON.parse(JSON.stringify(data.payments))}
        monthlyRevenue={data.monthlyRevenue}
        popularPackage={data.metrics.popularPackage}
      />
    </div>
  );
}
