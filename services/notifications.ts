import { type QueueStatus } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listRecentActivity } from "@/services/activity";
import { listQueues } from "@/services/queues";
import { listTransactions } from "@/services/transactions";
import { loadWithTimeoutFallback } from "@/lib/runtime/load-with-timeout";

export type OperationalNotification = {
  id: string;
  title: string;
  description: string;
  tone: "info" | "warning" | "success";
  createdAt?: string;
};

const activeQueueStatuses = new Set<QueueStatus>([
  "menunggu",
  "antrian",
  "sedang_dicuci",
  "interior_cleaning",
  "finishing",
  "diproses",
]);

export async function listOperationalNotifications(limit = 6): Promise<OperationalNotification[]> {
  try {
    const [queues, pendingTransactions, activity] = await Promise.all([
      loadWithTimeoutFallback(() => listQueues(), {
        fallback: () => [],
        label: "operational queues",
        timeoutMs: 2500,
      }),
      loadWithTimeoutFallback(() => listTransactions("", "belum_bayar"), {
        fallback: () => [],
        label: "pending transactions",
        timeoutMs: 2500,
      }),
      loadWithTimeoutFallback(() => listRecentActivity(3), {
        fallback: () => [],
        label: "recent activity",
        timeoutMs: 2500,
      }),
    ]);

    const activeQueues = queues.filter((queue) => activeQueueStatuses.has(queue.status));
    const nextQueue = activeQueues
      .slice()
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

    const notifications: OperationalNotification[] = [];

    if (nextQueue) {
      notifications.push({
        id: `queue-${nextQueue.id}`,
        title: `Antrian berikutnya ${nextQueue.queueNumber}`,
        description: `${nextQueue.customerName} dijadwalkan ${formatDate(nextQueue.scheduledAt)}.`,
        tone: "info",
        createdAt: toIsoString(nextQueue.createdAt),
      });
    }

    if (activeQueues.length > 0) {
      notifications.push({
        id: "active-queues",
        title: `${activeQueues.length} antrian aktif`,
        description: "Pantau status menunggu, diproses, interior cleaning, dan finishing.",
        tone: activeQueues.length > 3 ? "warning" : "info",
      });
    }

    if (pendingTransactions.length > 0) {
      const totalPending = pendingTransactions.reduce((sum, item) => sum + Number(item.total), 0);
      notifications.push({
        id: "pending-payments",
        title: `${pendingTransactions.length} transaksi belum lunas`,
        description: `Potensi pembayaran tertunda ${formatCurrency(totalPending)}.`,
        tone: "warning",
      });
    }

    notifications.push(
      ...activity.map((item) => ({
        id: `activity-${item.id}`,
        title: "Aktivitas terbaru",
        description: item.message,
        tone: "success" as const,
        createdAt: item.createdAt,
      })),
    );

    return notifications.slice(0, limit);
  } catch (error) {
    console.error("Failed to load operational notifications", error);
    return [];
  }
}

function toIsoString(value: Date | string | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}
