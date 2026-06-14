import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { ReportManager } from "@/features/reports/report-manager";
import { requireRole } from "@/lib/auth/session";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { getDashboardData, getEmptyDashboardData } from "@/services/dashboard";

export const metadata = {
  title: "Laporan Transaksi",
};

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type DashboardPayment = DashboardData["payments"][number];
type DashboardTransaction = DashboardData["transactions"][number];

export default async function ReportsPage() {
  await connection();
  await requireRole(["admin"]);
  const pageData = await loadReportsData();

  const { data, reportRows } = pageData;

  return (
    <div className="space-y-6">
      <div>
        <Badge>Admin Only</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Laporan Transaksi</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Filter tanggal, metode, status, paket populer, export CSV, XLSX, dan PDF.
        </p>
      </div>
      <ReportManager
        rows={JSON.parse(JSON.stringify(reportRows))}
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
    return await withDatabaseRetry(async () => {
      const data = await getDashboardData();
      return {
        data,
        reportRows: buildReportRows(data.transactions, data.payments),
      };
    });
  } catch (error) {
    console.error("Failed to load reports page data", error);
    const data = getEmptyDashboardData();
    return {
      data,
      reportRows: buildReportRows(data.transactions, data.payments),
    };
  }
}

function buildReportRows(transactions: DashboardTransaction[], payments: DashboardPayment[]) {
  const paymentByTransactionId = new Map(payments.map((payment) => [payment.transactionId, payment]));

  return transactions.map((transaction) => {
    const payment = paymentByTransactionId.get(transaction.id);

    return {
      id: transaction.id,
      transactionId: transaction.id,
      paymentId: payment?.id ?? null,
      queueNumber: transaction.queueNumber,
      customerName: transaction.customerName,
      packageName: transaction.packageName,
      method: payment?.method ?? null,
      status: transaction.status,
      subtotal: transaction.subtotal,
      discount: transaction.discount,
      total: transaction.total,
      createdAt: toIsoString(payment?.paidAt ?? payment?.createdAt ?? transaction.createdAt),
    };
  });
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}
