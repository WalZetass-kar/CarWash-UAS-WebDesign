import { demoActivity } from "@/lib/data";
import { normalizeQueueStatus, queueWorkflowStatuses } from "@/lib/constants";
import { getDateKey, getTodayKey } from "@/lib/utils";
import { listCustomers } from "@/services/customers";
import { listPackages } from "@/services/packages";
import { listPayments } from "@/services/payments";
import { listQueues } from "@/services/queues";
import { listTransactions } from "@/services/transactions";

function isToday(value: unknown) {
  return getDateKey(String(value)) === getTodayKey();
}

function isThisMonth(value: unknown) {
  const currentKey = getDateKey(new Date()).slice(0, 7);
  return getDateKey(String(value)).slice(0, 7) === currentKey;
}

function getWeeklySeries(
  payments: Array<{ amount: number; status: string; paidAt?: string | Date | null; createdAt: string | Date }>,
  transactions: Array<{ createdAt: string | Date }>,
) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  return days.map((date) => {
    const key = getDateKey(date);
    const dayLabel = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      timeZone: "Asia/Jakarta",
    }).format(date);

    return {
      day: dayLabel,
      revenue: payments
        .filter((payment) => payment.status === "lunas" && getDateKey(payment.paidAt ?? payment.createdAt) === key)
        .reduce((total, payment) => total + Number(payment.amount), 0),
      transactions: transactions.filter((transaction) => getDateKey(transaction.createdAt) === key).length,
    };
  });
}

function getMonthlySeries(
  payments: Array<{ amount: number; status: string; paidAt?: string | Date | null; createdAt: string | Date }>,
) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  return months.map((date) => {
    const monthKey = getDateKey(date).slice(0, 7);
    return {
      month: new Intl.DateTimeFormat("id-ID", {
        month: "short",
        timeZone: "Asia/Jakarta",
      }).format(date),
      revenue: payments
        .filter((payment) => payment.status === "lunas" && getDateKey(payment.paidAt ?? payment.createdAt).slice(0, 7) === monthKey)
        .reduce((total, payment) => total + Number(payment.amount), 0),
    };
  });
}

export async function getDashboardData() {
  const [customers, packages, queues, payments, transactions] = await Promise.all([
    listCustomers(),
    listPackages(),
    listQueues(),
    listPayments(),
    listTransactions(),
  ]);

  const paidPayments = payments.filter((payment) => payment.status === "lunas");
  const revenueToday = paidPayments
    .filter((payment) => isToday(payment.paidAt ?? payment.createdAt))
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const revenueMonth = paidPayments
    .filter((payment) => isThisMonth(payment.paidAt ?? payment.createdAt))
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const queuesToday = queues.filter((queue) => isToday(queue.scheduledAt ?? queue.createdAt));
  const completedToday = queuesToday.filter((queue) => normalizeQueueStatus(queue.status) === "selesai").length;
  const inProgressToday = queuesToday.filter((queue) => {
    const status = normalizeQueueStatus(queue.status);
    return queueWorkflowStatuses.includes(status) && !["menunggu", "selesai"].includes(status);
  }).length;

  const packageCounts = queues.reduce<Record<string, number>>((acc, queue) => {
    acc[queue.packageName] = (acc[queue.packageName] ?? 0) + 1;
    return acc;
  }, {});
  const popularPackage =
    Object.entries(packageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? packages[0]?.name ?? "-";

  return {
    metrics: {
      revenueToday,
      revenueMonth,
      totalTransactionsToday: transactions.filter((transaction) => isToday(transaction.createdAt)).length,
      totalVehiclesToday: queuesToday.length,
      completedToday,
      inProgressToday,
      totalCustomers: customers.length,
      totalWashed: queues.filter((queue) => normalizeQueueStatus(queue.status) === "selesai").length,
      popularPackage,
      queueActive: queues.filter((queue) => {
        const status = normalizeQueueStatus(queue.status);
        return queueWorkflowStatuses.includes(status) && !["menunggu", "selesai"].includes(status);
      }).length,
    },
    customers,
    packages,
    queues,
    payments,
    transactions,
    weeklyRevenue: getWeeklySeries(payments, transactions),
    monthlyRevenue: getMonthlySeries(payments),
    activity: demoActivity,
  };
}
