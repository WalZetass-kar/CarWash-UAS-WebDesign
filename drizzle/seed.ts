import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/drizzle/db";
import { customers, users, washPackages } from "@/drizzle/schema";
import { demoCustomers, demoPackages } from "@/lib/data";

async function main() {
  const db = getDb();
  const adminHash = await bcrypt.hash("admin123", 12);
  const petugasHash = await bcrypt.hash("petugas123", 12);

  const demoUsers = [
    {
      name: "Admin CleanRide",
      email: "admin@cleanride.my.id",
      passwordHash: adminHash,
      role: "admin" as const,
      isActive: true,
    },
    {
      name: "Petugas CleanRide",
      email: "petugas@cleanride.my.id",
      passwordHash: petugasHash,
      role: "petugas" as const,
      isActive: true,
    },
  ];

  for (const user of demoUsers) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, user.email),
    });

    if (existing) {
      await db
        .update(users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(users.email, user.email));
    } else {
      await db.insert(users).values(user);
    }
  }

  await db
    .insert(washPackages)
    .values(
      demoPackages.map((item) => ({
        name: item.name,
        description: item.description,
        price: item.price,
        estimatedMinutes: item.estimatedMinutes,
        isActive: item.isActive,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(customers)
    .values(
      demoCustomers.map((item) => ({
        name: item.name,
        phone: item.phone,
        licensePlate: item.licensePlate,
        vehicleType: item.vehicleType,
        notes: item.notes,
      })),
    )
    .onConflictDoNothing();

  console.log("Seed CleanRide selesai. Akun demo admin dan petugas siap digunakan.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
