import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "kasir", "staff", "petugas"]);
export const vehicleTypeEnum = pgEnum("vehicle_type", ["mobil", "motor", "suv", "pickup", "van"]);
export const queueStatusEnum = pgEnum("queue_status", [
  "menunggu",
  "antrian",
  "sedang_dicuci",
  "interior_cleaning",
  "finishing",
  "selesai",
  "dibatalkan",
  "diproses",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["tunai", "transfer", "qris", "e-wallet"]);
export const paymentStatusEnum = pgEnum("payment_status", ["belum_bayar", "lunas"]);

const lifecycleColumns = {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const users = pgTable(
  "users",
  {
    ...lifecycleColumns,
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 180 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("petugas"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_idx").on(table.role),
  ],
);

export const customers = pgTable(
  "customers",
  {
    ...lifecycleColumns,
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 24 }).notNull(),
    licensePlate: varchar("license_plate", { length: 20 }).notNull(),
    vehicleType: vehicleTypeEnum("vehicle_type").notNull().default("mobil"),
    notes: text("notes"),
  },
  (table) => [
    index("customers_name_idx").on(table.name),
    index("customers_plate_idx").on(table.licensePlate),
  ],
);

export const washPackages = pgTable(
  "wash_packages",
  {
    ...lifecycleColumns,
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [index("wash_packages_active_idx").on(table.isActive)],
);

export const queues = pgTable(
  "queues",
  {
    ...lifecycleColumns,
    queueNumber: varchar("queue_number", { length: 24 }).notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    packageId: uuid("package_id")
      .notNull()
      .references(() => washPackages.id),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: queueStatusEnum("status").notNull().default("menunggu"),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("queues_queue_number_unique").on(table.queueNumber),
    index("queues_status_idx").on(table.status),
    index("queues_scheduled_at_idx").on(table.scheduledAt),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    ...lifecycleColumns,
    queueId: uuid("queue_id")
      .notNull()
      .references(() => queues.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    packageId: uuid("package_id")
      .notNull()
      .references(() => washPackages.id),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    status: paymentStatusEnum("status").notNull().default("belum_bayar"),
    createdBy: uuid("created_by").references(() => users.id),
  },
  (table) => [
    index("transactions_created_at_idx").on(table.createdAt),
    index("transactions_status_idx").on(table.status),
  ],
);

export const payments = pgTable(
  "payments",
  {
    ...lifecycleColumns,
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id),
    method: paymentMethodEnum("method").notNull(),
    amount: integer("amount").notNull(),
    status: paymentStatusEnum("status").notNull().default("belum_bayar"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (table) => [
    index("payments_transaction_idx").on(table.transactionId),
    index("payments_method_idx").on(table.method),
  ],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    ...lifecycleColumns,
    userId: uuid("user_id").references(() => users.id),
    action: varchar("action", { length: 80 }).notNull(),
    entity: varchar("entity", { length: 80 }).notNull(),
    entityId: uuid("entity_id"),
    ipAddress: varchar("ip_address", { length: 80 }),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("activity_logs_user_idx").on(table.userId),
    index("activity_logs_entity_idx").on(table.entity, table.entityId),
    index("activity_logs_created_at_idx").on(table.createdAt),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  activityLogs: many(activityLogs),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  queues: many(queues),
  transactions: many(transactions),
}));

export const washPackagesRelations = relations(washPackages, ({ many }) => ({
  queues: many(queues),
  transactions: many(transactions),
}));

export const queuesRelations = relations(queues, ({ one, many }) => ({
  customer: one(customers, {
    fields: [queues.customerId],
    references: [customers.id],
  }),
  washPackage: one(washPackages, {
    fields: [queues.packageId],
    references: [washPackages.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  queue: one(queues, {
    fields: [transactions.queueId],
    references: [queues.id],
  }),
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
  washPackage: one(washPackages, {
    fields: [transactions.packageId],
    references: [washPackages.id],
  }),
  createdByUser: one(users, {
    fields: [transactions.createdBy],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  transaction: one(transactions, {
    fields: [payments.transactionId],
    references: [transactions.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type WashPackage = typeof washPackages.$inferSelect;
export type NewWashPackage = typeof washPackages.$inferInsert;
export type Queue = typeof queues.$inferSelect;
export type NewQueue = typeof queues.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export const schema = {
  users,
  customers,
  washPackages,
  queues,
  transactions,
  payments,
  activityLogs,
  usersRelations,
  customersRelations,
  washPackagesRelations,
  queuesRelations,
  transactionsRelations,
  paymentsRelations,
  activityLogsRelations,
};
