import { demoUserPasswords, demoUsers } from "@/lib/constants";
import {
  defaultAppSettings,
  demoCustomers,
  demoPackages,
  demoPayments,
  demoQueues,
  demoTransactions,
  type AiReviewAnalysis,
  type AppSettings,
  type Customer,
  type Payment,
  type QueueItem,
  type TransactionItem,
  type User,
  type WashPackage,
} from "@/lib/data";

export type DemoUserRecord = User & {
  password: string;
};

export type DemoActivityLog = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type DemoState = {
  activityLogs: DemoActivityLog[];
  aiReviewAnalyses: AiReviewAnalysis[];
  customers: Customer[];
  galleryUrls: string[];
  packages: WashPackage[];
  payments: Payment[];
  queues: QueueItem[];
  settings: AppSettings;
  transactions: TransactionItem[];
  users: DemoUserRecord[];
};

let demoState = createInitialDemoState();

export function getDemoState() {
  return demoState;
}

export function resetDemoState() {
  demoState = createInitialDemoState();
}

export function toPublicUser(user: DemoUserRecord): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function createInitialDemoState(): DemoState {
  const createdAt = new Date().toISOString();

  return {
    activityLogs: [
      {
        id: "60000000-0000-4000-8000-000000000010",
        userId: demoUsers[0].id,
        action: "login",
        entity: "auth",
        entityId: null,
        ipAddress: "127.0.0.1",
        userAgent: "demo-browser",
        createdAt,
      },
    ],
    aiReviewAnalyses: [],
    customers: demoCustomers.map((item) => ({ ...item })),
    galleryUrls: [],
    packages: demoPackages.map((item) => ({ ...item })),
    payments: demoPayments.map((item) => ({ ...item })),
    queues: demoQueues.map((item) => ({ ...item })),
    settings: { ...defaultAppSettings },
    transactions: demoTransactions.map((item) => ({ ...item })),
    users: demoUsers.map((item) => ({
      ...item,
      createdAt,
      password: demoUserPasswords[item.email] ?? "admin123",
    })),
  };
}
