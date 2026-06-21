import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { PaymentManager } from "@/features/payments/payment-manager";
import { defaultAppSettings } from "@/lib/data";
import { loadWithTimeoutFallback } from "@/lib/runtime/load-with-timeout";
import { listPayments } from "@/services/payments";
import { getAppSettings } from "@/services/settings";
import { listTransactions } from "@/services/transactions";

export const metadata = {
  title: "Pembayaran",
};

const blankSettings = {
  ...defaultAppSettings,
  businessName: "",
  businessPhone: "",
  businessAddress: "",
  queueSlotCapacity: 1,
  reportDefaultRangeDays: 1,
  autoPrintInvoice: false,
  invoiceFooter: "",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; highlight?: string; transactionId?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const data = await loadPaymentsData();

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
    const [payments, transactions, allTransactions, settings] = await Promise.all([
      loadWithTimeoutFallback(() => listPayments(), {
        fallback: () => [],
        label: "payments page payments",
        timeoutMs: 2500,
      }),
      loadWithTimeoutFallback(() => listTransactions("", "belum_bayar"), {
        fallback: () => [],
        label: "payments page pending transactions",
        timeoutMs: 2500,
      }),
      loadWithTimeoutFallback(() => listTransactions(), {
        fallback: () => [],
        label: "payments page all transactions",
        timeoutMs: 2500,
      }),
      loadWithTimeoutFallback(() => getAppSettings(), {
        fallback: () => ({ ...blankSettings }),
        label: "payments page settings",
        timeoutMs: 2500,
      }),
    ]);

    return [payments, transactions, allTransactions, settings] as const;
  } catch (error) {
    console.error("Failed to load payments page data", error);
    return [[], [], [], { ...blankSettings }] as const;
  }
}
