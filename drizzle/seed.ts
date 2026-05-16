import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/drizzle/db";
import {
  activityLogs,
  customers,
  payments,
  queues,
  transactions,
  users,
  washPackages,
} from "@/drizzle/schema";
import {
  demoCustomers,
  demoPackages,
  demoPayments,
  demoQueues,
  demoTransactions,
} from "@/lib/data";
import { demoUsers } from "@/lib/constants";

async function main() {
  const db = getDb();
  const adminHash = await bcrypt.hash("admin123", 12);
  const petugasHash = await bcrypt.hash("petugas123", 12);

  const seededUsers = [
    {
      ...demoUsers[0],
      passwordHash: adminHash,
    },
    {
      ...demoUsers[1],
      passwordHash: petugasHash,
    },
  ];

  for (const user of seededUsers) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, user.email),
    });

    if (existing) {
      await db
        .update(users)
        .set({
          name: user.name,
          passwordHash: user.passwordHash,
          role: user.role,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.email, user.email));
    } else {
      await db.insert(users).values(user);
    }
  }

  await db
    .insert(washPackages)
    .values(
      demoPackages.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        estimatedMinutes: item.estimatedMinutes,
        isActive: item.isActive,
        createdAt: new Date(item.createdAt),
      })),
    )
    .onConflictDoUpdate({
      target: washPackages.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(customers)
    .values(
      demoCustomers.map((item) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        licensePlate: item.licensePlate,
        vehicleType: item.vehicleType,
        notes: item.notes,
        createdAt: new Date(item.createdAt),
      })),
    )
    .onConflictDoUpdate({
      target: customers.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(queues)
    .values(
      demoQueues.map((item) => ({
        id: item.id,
        queueNumber: item.queueNumber,
        customerId: item.customerId,
        packageId: item.packageId,
        scheduledAt: new Date(item.scheduledAt),
        status: item.status,
        createdAt: new Date(item.createdAt),
      })),
    )
    .onConflictDoUpdate({
      target: queues.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(transactions)
    .values(
      demoTransactions.map((item) => ({
        id: item.id,
        queueId: item.queueId,
        customerId: item.customerId,
        packageId: item.packageId,
        subtotal: item.total,
        discount: 0,
        total: item.total,
        status: item.status,
        createdBy: demoUsers[0].id,
        createdAt: new Date(item.createdAt),
      })),
    )
    .onConflictDoUpdate({
      target: transactions.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(payments)
    .values(
      demoPayments.map((item) => ({
        id: item.id,
        transactionId: item.transactionId,
        method: item.method,
        amount: item.amount,
        status: item.status,
        paidAt: item.paidAt ? new Date(item.paidAt) : null,
        createdAt: new Date(item.createdAt),
      })),
    )
    .onConflictDoUpdate({
      target: payments.id,
      set: {
        updatedAt: new Date(),
      },
    });

  await db
    .insert(activityLogs)
    .values([
      {
        id: "60000000-0000-4000-8000-000000000001",
        userId: demoUsers[0].id,
        action: "seed",
        entity: "database",
        ipAddress: "127.0.0.1",
        userAgent: "drizzle-seed",
      },
    ])
    .onConflictDoNothing();

  console.log("Seed CleanRide selesai. Data relasional, transaksi, dan akun demo siap.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
