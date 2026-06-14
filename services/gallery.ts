import { and, desc, eq, isNull } from "drizzle-orm";
import { gallery } from "@/drizzle/schema";
import { getDb, shouldUseTestFixtures } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function listGalleryImages(limit = 6) {
  if (shouldUseTestFixtures()) {
    const state = getDemoState();
    if (state.galleryUrls.length > 0) {
      return state.galleryUrls.slice(0, limit);
    }
    return listGalleryImagesFromStorage(limit);
  }

  try {
    const rows = await getDb()
      .select({ url: gallery.url })
      .from(gallery)
      .where(and(eq(gallery.isActive, true), isNull(gallery.deletedAt)))
      .orderBy(desc(gallery.sortOrder), desc(gallery.createdAt))
      .limit(limit);

    if (rows && rows.length > 0) {
      return rows.map((r) => r.url);
    }
  } catch (error) {
    console.error("Failed to list gallery from DB, falling back to storage", error);
  }

  return listGalleryImagesFromStorage(limit);
}

async function listGalleryImagesFromStorage(limit: number) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const objectNames = await listGalleryStorageObjectNames(supabase, limit, limit);
  if (!objectNames.length) return [];

  const urls = objectNames.slice(0, limit)
    .map((name) => {
      const { data: publicUrl } = supabase.storage
        .from("kilapkendaraan")
        .getPublicUrl(`gallery/${name}`);
      return publicUrl?.publicUrl;
    })
    .filter(Boolean) as string[];

  return urls;
}

export async function deleteAllGalleryStorageObjects() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;

  const objectNames = await listGalleryStorageObjectNames(supabase, 1_000);
  if (!objectNames.length) return 0;

  const { error } = await supabase.storage.from("kilapkendaraan").remove(
    objectNames.map((name) => `gallery/${name}`),
  );

  if (error) {
    throw new Error(`Gagal menghapus file gallery dari storage: ${error.message}`);
  }

  return objectNames.length;
}

async function listGalleryStorageObjectNames(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  pageSize: number,
  maxItems = Number.POSITIVE_INFINITY,
) {
  const objectNames: string[] = [];
  let offset = 0;

  while (objectNames.length < maxItems) {
    const limit = Math.min(pageSize, maxItems - objectNames.length);
    const { data, error } = await supabase.storage.from("kilapkendaraan").list("gallery", {
      limit,
      offset,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      throw new Error(`Gagal membaca file gallery dari storage: ${error.message}`);
    }

    const names = (data ?? [])
      .filter((item) => item.name && !item.name.endsWith("/"))
      .map((item) => item.name);

    objectNames.push(...names);

    if (!data || data.length < limit) {
      break;
    }

    offset += data.length;
  }

  return Array.from(new Set(objectNames)).slice(0, maxItems);
}
