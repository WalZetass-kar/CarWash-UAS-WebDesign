import { and, desc, eq, isNull } from "drizzle-orm";
import { gallery } from "@/drizzle/schema";
import { getDb, shouldUseDemoData } from "@/drizzle/db";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const fallbackGalleryImages = [
  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600320254374-ce2d293c324e?auto=format&fit=crop&w=900&q=80",
];

export async function listGalleryImages(limit = 6) {
  if (shouldUseDemoData()) {
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

  const { data, error } = await supabase.storage.from("kilapkendaraan").list("gallery", {
    limit,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error || !data || data.length === 0) return fallbackGalleryImages;

  const urls = data
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => {
      const { data: publicUrl } = supabase.storage
        .from("kilapkendaraan")
        .getPublicUrl(`gallery/${item.name}`);
      return publicUrl?.publicUrl;
    })
    .filter(Boolean) as string[];

  return urls.length ? urls : fallbackGalleryImages;
}
