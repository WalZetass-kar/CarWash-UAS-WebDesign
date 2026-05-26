import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { BackendSetupNotice } from "@/components/runtime/backend-setup-notice";
import { ReportManager } from "@/features/reports/report-manager";
import { requireRole } from "@/lib/auth/session";
import { getDashboardData } from "@/services/dashboard";
import { getReportData } from "@/services/reports";

export const metadata = {
  title: "Laporan Transaksi",
};

export default async function ReportsPage() {
  await connection();
  await requireRole(["admin"]);
  const pageData = await loadReportsData();
  if (!pageData) return <BackendSetupNotice area="dashboard" compact issue="connection-error" />;

  const [data, reportData] = pageData;

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
        rows={JSON.parse(JSON.stringify(reportData.rows))}
        monthlyRevenue={data.monthlyRevenue}
        popularPackage={data.metrics.popularPackage}
        businessName={data.settings.businessName}
        defaultRangeDays={data.settings.reportDefaultRangeDays}
      />
    </div>
  );
}

async function loadReportsData() {
  try {
    return await Promise.all([getDashboardData(), getReportData()]);
  } catch (error) {
    console.error("Failed to load reports page data", error);
    return null;
  }
}
