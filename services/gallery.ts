import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const fallbackGalleryImages = [
  "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600320254374-ce2d293c324e?auto=format&fit=crop&w=900&q=80",
];

export async function listGalleryImages(limit = 6) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return fallbackGalleryImages;

  const { data, error } = await supabase.storage.from("cleanride").list("gallery", {
    limit,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error || !data?.length) return fallbackGalleryImages;

  const urls = data
    .filter((item) => item.name && !item.name.endsWith("/"))
    .map((item) => {
      const { data: publicUrl } = supabase.storage
        .from("cleanride")
        .getPublicUrl(`gallery/${item.name}`);
      return publicUrl.publicUrl;
    })
    .filter(Boolean);

  return urls.length ? urls : fallbackGalleryImages;
}
