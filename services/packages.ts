import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { washPackages } from "@/drizzle/schema";
import { getDb, hasDatabaseConfig } from "@/drizzle/db";
import { demoPackages, type WashPackage } from "@/lib/data";
import type { PackageInput } from "@/schemas/package";

let memoryPackages: WashPackage[] = [...demoPackages];

export async function listPackages(query = "") {
  if (!hasDatabaseConfig()) {
    const normalized = query.toLowerCase();
    return memoryPackages.filter((item) =>
      [item.name, item.description, item.price].join(" ").toLowerCase().includes(normalized),
    );
  }

  const where = query
    ? and(isNull(washPackages.deletedAt), ilike(washPackages.name, `%${query}%`))
    : isNull(washPackages.deletedAt);

  return getDb().select().from(washPackages).where(where).orderBy(desc(washPackages.createdAt));
}

export async function createPackage(input: PackageInput) {
  if (!hasDatabaseConfig()) {
    const washPackage: WashPackage = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    memoryPackages = [washPackage, ...memoryPackages];
    return washPackage;
  }

  const [created] = await getDb().insert(washPackages).values(input).returning();
  return created;
}

export async function updatePackage(id: string, input: PackageInput) {
  if (!hasDatabaseConfig()) {
    memoryPackages = memoryPackages.map((item) =>
      item.id === id ? { ...item, ...input } : item,
    );
    return memoryPackages.find((item) => item.id === id) ?? null;
  }

  const [updated] = await getDb()
    .update(washPackages)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(washPackages.id, id), isNull(washPackages.deletedAt)))
    .returning();
  return updated ?? null;
}

export async function deletePackage(id: string) {
  if (!hasDatabaseConfig()) {
    memoryPackages = memoryPackages.filter((item) => item.id !== id);
    return true;
  }

  await getDb()
    .update(washPackages)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(washPackages.id, id));
  return true;
}
