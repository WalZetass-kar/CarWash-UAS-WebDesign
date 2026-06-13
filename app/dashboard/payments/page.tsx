import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { BackendSetupNotice } from "@/components/runtime/backend-setup-notice";
import { PaymentManager } from "@/features/payments/payment-manager";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { listPayments } from "@/services/payments";
import { getAppSettings } from "@/services/settings";
import { listTransactions } from "@/services/transactions";

export const metadata = {
  title: "Pembayaran",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; highlight?: string; transactionId?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const data = await loadPaymentsData();
  if (!data) return <BackendSetupNotice area="dashboard" compact issue="connection-error" />;

  const [payments, transactions, allTransactions, settings] = data;

  return (
    <div className="space-y-6">
      <div>
        <Badge>Invoice System</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Pembayaran</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Kelola metode pembayaran, status lunas, invoice printable, dan export PDF.
        </p>
      </div>
      <PaymentManager
        initialData={JSON.parse(JSON.stringify(payments))}
        transactions={JSON.parse(JSON.stringify(transactions))}
        allTransactions={JSON.parse(JSON.stringify(allTransactions))}
        settings={JSON.parse(JSON.stringify(settings))}
        initialSearch={params.query ?? ""}
        highlightedId={params.highlight ?? ""}
        initialTransactionId={params.transactionId ?? ""}
      />
    </div>
  );
}

async function loadPaymentsData() {
  try {
    return await withDatabaseRetry(async () => {
      const payments = await listPayments();
      const transactions = await listTransactions("", "belum_bayar");
      const allTransactions = await listTransactions();
      const settings = await getAppSettings();
      return [payments, transactions, allTransactions, settings] as const;
    });
  } catch (error) {
    console.error("Failed to load payments page data", error);
    return null;
  }
}
