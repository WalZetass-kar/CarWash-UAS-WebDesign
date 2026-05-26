import { APP_TIME_ZONE } from "@/lib/constants";
import { type ReportRow } from "@/lib/data";
import { getDateKey } from "@/lib/utils";
import { listPayments } from "@/services/payments";
import { getAppSettings } from "@/services/settings";
import { listTransactions } from "@/services/transactions";

export async function getReportData(filters?: { from?: string; to?: string }) {
  const [transactions, payments, settings] = await Promise.all([
    listTransactions(),
    listPayments(),
    getAppSettings(),
  ]);
  const paymentByTransactionId = new Map(payments.map((payment) => [payment.transactionId, payment]));

  const rows = transactions
    .map<ReportRow>((transaction) => {
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
        total: transaction.total,
        createdAt: toIsoString(payment?.paidAt ?? payment?.createdAt ?? transaction.createdAt),
      };
    })
    .filter((row) => isWithinDateRange(row.createdAt, filters?.from, filters?.to));

  const totalIncome = rows
    .filter((row) => row.status === "lunas")
    .reduce((sum, row) => sum + Number(row.total), 0);

  return {
    rows,
    totalIncome,
    settings,
  };
}

function isWithinDateRange(value: string, from?: string, to?: string) {
  const dateKey = getDateKey(value, APP_TIME_ZONE);
  if (!dateKey) return false;

  if (from && dateKey < from) return false;
  if (to && dateKey > to) return false;
  return true;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}
