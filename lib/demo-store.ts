import {
  type AiReviewAnalysis,
  demoCustomers,
  demoPackages,
  demoPayments,
  demoQueues,
  demoTransactions,
  type Customer,
  type Payment,
  type QueueItem,
  type TransactionItem,
  type User,
  type WashPackage,
} from "@/lib/data";
import { demoUserPasswords, demoUsers } from "@/lib/constants";

const userCreatedAt = new Date().toISOString();

export const demoStore: {
  customers: Customer[];
  packages: WashPackage[];
  queues: QueueItem[];
  transactions: TransactionItem[];
  payments: Payment[];
  aiReviewAnalyses: AiReviewAnalysis[];
  users: User[];
  passwords: Record<string, string>;
} = {
  customers: [...demoCustomers],
  packages: [...demoPackages],
  queues: [...demoQueues],
  transactions: [...demoTransactions],
  payments: [...demoPayments],
  aiReviewAnalyses: [],
  users: demoUsers.map((user) => ({
    ...user,
    createdAt: userCreatedAt,
  })),
  passwords: { ...demoUserPasswords },
};
