import { and, desc, eq, isNull } from "drizzle-orm";
import { gallery } from "@/drizzle/schema";
import { getDb, shouldUseDemoData } from "@/drizzle/db";
import { getDemoState } from "@/lib/demo-store";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const fallbackGalleryImages = [
  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600320254374-ce2d293c324e?auto=format&fit=crop&w=900&q=80",
];

export async function listGalleryImages(limit = 6) {
  if (shouldUseDemoData()) {
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
  if (!supabase) return fallbackGalleryImages;

  const objectNames = await listGalleryStorageObjectNames(supabase, limit, limit);
  if (!objectNames.length) return fallbackGalleryImages;

  const urls = objectNames.slice(0, limit)
    .map((name) => {
      const { data: publicUrl } = supabase.storage
        .from("kilapkendaraan")
        .getPublicUrl(`gallery/${name}`);
      return publicUrl?.publicUrl;
    })
    .filter(Boolean) as string[];

  return urls.length ? urls : fallbackGalleryImages;
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
