import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { PaymentManager } from "@/features/payments/payment-manager";
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
  const [payments, transactions, settings] = await Promise.all([
    listPayments(),
    listTransactions("", "belum_bayar"),
    getAppSettings(),
  ]);

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
        settings={JSON.parse(JSON.stringify(settings))}
        initialSearch={params.query ?? ""}
        highlightedId={params.highlight ?? ""}
        initialTransactionId={params.transactionId ?? ""}
      />
    </div>
  );
}
