import { demoActivity, monthlyRevenue, weeklyRevenue } from "@/lib/data";
import { listCustomers } from "@/services/customers";
import { listPackages } from "@/services/packages";
import { listPayments } from "@/services/payments";
import { listQueues } from "@/services/queues";
import { listUsers } from "@/services/users";

function isToday(value: unknown) {
  const date = new Date(String(value));
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isThisMonth(value: unknown) {
  const date = new Date(String(value));
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

export async function getDashboardData() {
  const [customers, packages, queues, payments, users] = await Promise.all([
    listCustomers(),
    listPackages(),
    listQueues(),
    listPayments(),
    listUsers(),
  ]);

  const paidPayments = payments.filter((payment) => payment.status === "lunas");
  const revenueToday = paidPayments
    .filter((payment) => isToday(payment.paidAt ?? payment.createdAt))
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const revenueMonth = paidPayments
    .filter((payment) => isThisMonth(payment.paidAt ?? payment.createdAt))
    .reduce((total, payment) => total + Number(payment.amount), 0);

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
      totalCustomers: customers.length,
      totalWashed: queues.filter((queue) => queue.status === "selesai").length,
      popularPackage,
      queueActive: queues.filter((queue) => ["menunggu", "diproses"].includes(queue.status)).length,
    },
    customers,
    packages,
    queues,
    payments,
    users,
    weeklyRevenue,
    monthlyRevenue,
    activity: demoActivity,
  };
}
