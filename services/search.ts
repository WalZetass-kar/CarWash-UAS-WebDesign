import { listCustomers } from "@/services/customers";
import { listQueues } from "@/services/queues";
import { listPayments } from "@/services/payments";
import { listUsers } from "@/services/users";

export async function globalSearch(query: string) {
  const [customers, queues, payments, users] = await Promise.all([
    listCustomers(query),
    listQueues(query),
    listPayments(query),
    listUsers(query),
  ]);

  return [
    ...customers.slice(0, 5).map((item) => ({
      type: "Pelanggan",
      title: item.name,
      description: `${item.licensePlate} - ${item.phone}`,
      href: "/dashboard/customers",
    })),
    ...queues.slice(0, 5).map((item) => ({
      type: "Antrian",
      title: item.queueNumber,
      description: `${item.customerName} - ${item.status}`,
      href: "/dashboard/queues",
    })),
    ...payments.slice(0, 5).map((item) => ({
      type: "Transaksi",
      title: item.queueNumber,
      description: `${item.customerName} - ${item.status}`,
      href: "/dashboard/payments",
    })),
    ...users.slice(0, 5).map((item) => ({
      type: "User",
      title: item.name,
      description: `${item.email} - ${item.role}`,
      href: "/dashboard/users",
    })),
  ].slice(0, 12);
}
