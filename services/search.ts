import { listCustomers } from "@/services/customers";
import { listPackages } from "@/services/packages";
import { listQueues } from "@/services/queues";
import { listPayments } from "@/services/payments";
import { listTransactions } from "@/services/transactions";
import { listUsers } from "@/services/users";
import { formatCurrency } from "@/lib/utils";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";

export async function globalSearch(query: string) {
  return withDatabaseRetry(async () => {
    const customers = await listCustomers(query);
    const packages = await listPackages(query);
    const queues = await listQueues(query);
    const payments = await listPayments(query);
    const pendingTransactions = await listTransactions(query, "belum_bayar");
    const users = await listUsers(query);

    return [
      ...customers.slice(0, 5).map((item) => ({
        type: "Pelanggan",
        title: item.name,
        description: `${item.licensePlate} - ${item.phone}`,
        href: `/dashboard/customers?query=${encodeURIComponent(item.licensePlate)}&highlight=${item.id}`,
      })),
      ...packages.slice(0, 5).map((item) => ({
        type: "Paket",
        title: item.name,
        description: `${item.estimatedMinutes} menit - ${formatCurrency(item.price)}`,
        href: `/dashboard/packages?query=${encodeURIComponent(item.name)}&highlight=${item.id}`,
      })),
      ...queues.slice(0, 5).map((item) => ({
        type: "Antrian",
        title: item.queueNumber,
        description: `${item.customerName} - ${item.status}`,
        href: `/dashboard/queues?query=${encodeURIComponent(item.queueNumber)}&highlight=${item.id}`,
      })),
      ...payments.slice(0, 5).map((item) => ({
        type: "Pembayaran",
        title: item.queueNumber,
        description: `${item.customerName} - ${item.status}`,
        href: `/dashboard/payments?query=${encodeURIComponent(item.queueNumber)}&highlight=${item.id}`,
      })),
      ...pendingTransactions.slice(0, 5).map((item) => ({
        type: "Transaksi Pending",
        title: item.queueNumber,
        description: `${item.customerName} - belum dibayar`,
        href: `/dashboard/payments?query=${encodeURIComponent(item.queueNumber)}&transactionId=${item.id}`,
      })),
      ...users.slice(0, 5).map((item) => ({
        type: "User",
        title: item.name,
        description: `${item.email} - ${item.role}`,
        href: `/dashboard/users?query=${encodeURIComponent(item.email)}&highlight=${item.id}`,
      })),
    ].slice(0, 12);
  });
}
