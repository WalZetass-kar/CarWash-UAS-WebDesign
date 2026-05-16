import { Badge } from "@/components/ui/badge";
import { PaymentManager } from "@/features/payments/payment-manager";
import { listPayments } from "@/services/payments";

export const metadata = {
  title: "Pembayaran",
};

export default async function PaymentsPage() {
  const payments = JSON.parse(JSON.stringify(await listPayments()));

  return (
    <div className="space-y-6">
      <div>
        <Badge>Invoice System</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Pembayaran</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Kelola metode pembayaran, status lunas, invoice printable, dan export PDF.
        </p>
      </div>
      <PaymentManager initialData={payments} />
    </div>
  );
}
