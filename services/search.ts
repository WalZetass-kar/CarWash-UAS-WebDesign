import { listCustomers } from "@/services/customers";
import { listPackages } from "@/services/packages";
import { listQueues } from "@/services/queues";
import { listPayments } from "@/services/payments";
import { listTransactions } from "@/services/transactions";
import { listUsers } from "@/services/users";
import { formatCurrency } from "@/lib/utils";

export async function globalSearch(query: string) {
  const [customers, packages, queues, payments, pendingTransactions, users] = await Promise.all([
    listCustomers(query),
    listPackages(query),
    listQueues(query),
    listPayments(query),
    listTransactions(query, "belum_bayar"),
    listUsers(query),
  ]);

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
}
