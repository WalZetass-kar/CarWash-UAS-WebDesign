import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { washPackages } from "@/drizzle/schema";
import { getDb, shouldUseDemoData } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { type WashPackage } from "@/lib/data";
import type { PackageInput } from "@/schemas/package";

export async function listPackages(query = "") {
  if (shouldUseDemoData()) {
    const { packages: memoryPackages } = getDemoState();
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
  if (shouldUseDemoData()) {
    const state = getDemoState();
    const washPackage: WashPackage = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    state.packages = [washPackage, ...state.packages];
    return washPackage;
  }

  const [created] = await getDb().insert(washPackages).values(input).returning();
  return created;
}

export async function updatePackage(id: string, input: PackageInput) {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.packages = state.packages.map((item) =>
      item.id === id ? { ...item, ...input } : item,
    );
    return state.packages.find((item) => item.id === id) ?? null;
  }

  const [updated] = await getDb()
    .update(washPackages)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(washPackages.id, id), isNull(washPackages.deletedAt)))
    .returning();
  return updated ?? null;
}

export async function deletePackage(id: string) {
  if (shouldUseDemoData()) {
    const state = getDemoState();
    state.packages = state.packages.filter((item) => item.id !== id);
    return true;
  }

  await getDb()
    .update(washPackages)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(washPackages.id, id));
  return true;
}
