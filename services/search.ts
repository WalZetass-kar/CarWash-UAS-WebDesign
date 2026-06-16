import { reviewSentimentLabels, roleLabels, queueStatusLabels, type Role } from "@/lib/constants";
import { listAiReviews } from "@/services/ai-reviews";
import { listCustomers } from "@/services/customers";
import { listQueues } from "@/services/queues";
import { listPayments } from "@/services/payments";
import { listUsers } from "@/services/users";

export async function globalSearch(query: string, role: Role) {
  const [customers, queues, payments, users, aiReviews] = await Promise.all([
    listCustomers(query),
    listQueues(query),
    listPayments(query),
    role === "admin" ? listUsers(query) : Promise.resolve([]),
    listAiReviews(query),
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
      description: `${item.customerName} - ${queueStatusLabels[item.status]}`,
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
      description: `${item.email} - ${roleLabels[item.role]}`,
      href: "/dashboard/users",
    })),
    ...aiReviews.slice(0, 3).map((item) => ({
      type: "Analisis AI",
      title: item.customerName,
      description: `${reviewSentimentLabels[item.sentiment]} - ${item.review.slice(0, 54)}${item.review.length > 54 ? "..." : ""}`,
      href: "/dashboard/ai-analysis",
    })),
  ].slice(0, 12);
}
