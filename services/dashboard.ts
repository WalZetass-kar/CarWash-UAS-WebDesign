import { APP_TIME_ZONE } from "@/lib/constants";
import { getDateKey, getLastDays, getLastMonths, getMonthKey } from "@/lib/utils";
import { listCustomers } from "@/services/customers";
import { listPackages } from "@/services/packages";
import { listPayments } from "@/services/payments";
import { listQueues } from "@/services/queues";
import { getAppSettings } from "@/services/settings";
import { listRecentActivity } from "@/services/activity";
import { listTransactions } from "@/services/transactions";
import { listUsers } from "@/services/users";

export async function getDashboardData() {
  const customers = await listCustomers();
  const packages = await listPackages();
  const queues = await listQueues();
  const payments = await listPayments();
  const transactions = await listTransactions();
  const users = await listUsers();
  const settings = await getAppSettings();
  const activity = await listRecentActivity(6);

  const todayKey = getDateKey(new Date(), APP_TIME_ZONE);
  const currentMonthKey = getMonthKey(new Date(), APP_TIME_ZONE);
  const paidPayments = payments.filter((payment) => payment.status === "lunas");
  const revenueToday = paidPayments
    .filter((payment) => getDateKey(payment.paidAt ?? payment.createdAt, APP_TIME_ZONE) === todayKey)
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const revenueMonth = paidPayments
    .filter((payment) => getMonthKey(payment.paidAt ?? payment.createdAt, APP_TIME_ZONE) === currentMonthKey)
    .reduce((total, payment) => total + Number(payment.amount), 0);

  const packageCounts = queues.reduce<Record<string, number>>((acc, queue) => {
    acc[queue.packageName] = (acc[queue.packageName] ?? 0) + 1;
    return acc;
  }, {});
  const popularPackage =
    Object.entries(packageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? packages[0]?.name ?? "-";
  const weeklyRevenue = getLastDays(7, APP_TIME_ZONE).map((day) => {
    const dailyPayments = paidPayments.filter(
      (payment) => getDateKey(payment.paidAt ?? payment.createdAt, APP_TIME_ZONE) === day.key,
    );

    return {
      day: day.label,
      revenue: dailyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      transactions: dailyPayments.length,
    };
  });
  const monthlyRevenue = getLastMonths(6, APP_TIME_ZONE).map((month) => {
    const monthlyPayments = paidPayments.filter(
      (payment) => getMonthKey(payment.paidAt ?? payment.createdAt, APP_TIME_ZONE) === month.key,
    );

    return {
      month: month.label,
      revenue: monthlyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    };
  });

  return {
    metrics: {
      revenueToday,
      revenueMonth,
      totalCustomers: customers.length,
      totalWashed: queues.filter((queue) => queue.status === "selesai").length,
      popularPackage,
      queueActive: queues.filter((queue) => ["menunggu", "diproses"].includes(queue.status)).length,
      paidTransactions: transactions.filter((transaction) => transaction.status === "lunas").length,
      unpaidTransactions: transactions.filter((transaction) => transaction.status === "belum_bayar").length,
    },
    customers,
    packages,
    queues,
    payments,
    transactions,
    users,
    weeklyRevenue,
    monthlyRevenue,
    settings,
    activity,
  };
}
