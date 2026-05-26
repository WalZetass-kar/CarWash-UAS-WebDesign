import { and, desc, eq, isNull } from "drizzle-orm";
import { customers, payments, queues, transactions, washPackages } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import { demoStore } from "@/lib/demo-store";
import { normalizeQueueStatus, type PaymentMethod, type PaymentStatus, type QueueStatus } from "@/lib/constants";

export type CustomerHistoryEntry = {
  id: string;
  queueNumber: string;
  packageName: string;
  licensePlate: string;
  queueStatus: QueueStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  total: number;
  paidAt?: string | null;
  createdAt: string;
};

export type CustomerHistoryData = {
  customer: {
    id: string;
    name: string;
    phone: string;
    licensePlate: string;
    vehicleType: string;
    notes?: string | null;
    createdAt: string;
  };
  summary: {
    totalSpent: number;
    vehicles: string[];
    favoritePackage: string;
    visits: number;
    completed: number;
  };
  history: CustomerHistoryEntry[];
};

function buildSummary(history: CustomerHistoryEntry[]) {
  const favoritePackage =
    Object.entries(
      history.reduce<Record<string, number>>((acc, item) => {
        acc[item.packageName] = (acc[item.packageName] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return {
    totalSpent: history
      .filter((item) => item.paymentStatus === "lunas")
      .reduce((total, item) => total + Number(item.total), 0),
    vehicles: Array.from(new Set(history.map((item) => item.licensePlate))),
    favoritePackage,
    visits: history.length,
    completed: history.filter((item) => normalizeQueueStatus(item.queueStatus) === "selesai").length,
  };
}

export async function getCustomerHistory(customerId: string): Promise<CustomerHistoryData | null> {
  if (!hasDatabaseConfig()) {
    const customer = demoStore.customers.find((item) => item.id === customerId);
    if (!customer) return null;

    const history = demoStore.transactions
      .filter((item) => item.customerId === customerId)
      .map((transaction) => {
        const queue = demoStore.queues.find((item) => item.id === transaction.queueId);
        const payment = demoStore.payments.find((item) => item.transactionId === transaction.id);
        return {
          id: transaction.id,
          queueNumber: transaction.queueNumber,
          packageName: transaction.packageName,
          licensePlate: queue?.licensePlate ?? customer.licensePlate,
          queueStatus: queue?.status ?? "menunggu",
          paymentStatus: transaction.status,
          paymentMethod: payment?.method ?? null,
          total: transaction.total,
          paidAt: payment?.paidAt ?? null,
          createdAt: transaction.createdAt,
        } satisfies CustomerHistoryEntry;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      customer,
      summary: buildSummary(history),
      history,
    };
  }

  const db = getDb();
  const customer = await db.query.customers.findFirst({
    where: (table, { and }) => and(eq(table.id, customerId), isNull(table.deletedAt)),
  });

  if (!customer) return null;

  const history = await db
    .select({
      id: transactions.id,
      queueNumber: queues.queueNumber,
      packageName: washPackages.name,
      licensePlate: customers.licensePlate,
      queueStatus: queues.status,
      paymentStatus: transactions.status,
      paymentMethod: payments.method,
      total: transactions.total,
      paidAt: payments.paidAt,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .innerJoin(queues, eq(transactions.queueId, queues.id))
    .innerJoin(customers, eq(transactions.customerId, customers.id))
    .innerJoin(washPackages, eq(transactions.packageId, washPackages.id))
    .leftJoin(payments, and(eq(payments.transactionId, transactions.id), isNull(payments.deletedAt)))
    .where(and(eq(transactions.customerId, customerId), isNull(transactions.deletedAt)))
    .orderBy(desc(transactions.createdAt));

  const normalizedHistory = history.map((item) => ({
    ...item,
    paidAt: item.paidAt ? item.paidAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
  }));

  return {
    customer: {
      ...customer,
      createdAt: customer.createdAt.toISOString(),
    },
    summary: buildSummary(normalizedHistory),
    history: normalizedHistory,
  };
}
