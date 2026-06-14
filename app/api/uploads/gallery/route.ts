import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";
import { validateUploadFile } from "@/lib/security/upload-guard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getDb } from "@/drizzle/db";
import { gallery } from "@/drizzle/schema";

export async function POST(request: NextRequest) {
  const csrfResponse = rejectInvalidCsrf(request);
  if (csrfResponse) return csrfResponse;

  const { response } = await requireApiRole(request, ["admin"]);
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonResponse({ message: "File tidak ditemukan" }, 422);
  }

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    return jsonResponse({ message: validation.reason }, 422);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "webp";
  const path = `gallery/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const supabase = createSupabaseAdminClient();

  if (supabase) {
    const { error } = await supabase.storage.from("kilapkendaraan").upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return jsonResponse(
        {
          message:
            "Upload Supabase gagal. Pastikan bucket public bernama kilapkendaraan sudah dibuat.",
          detail: error.message,
        },
        500,
      );
    }

    const { data } = supabase.storage.from("kilapkendaraan").getPublicUrl(path);

    try {
      await getDb().insert(gallery).values({
        url: data.publicUrl,
      });
    } catch (dbError) {
      console.error("Failed to save gallery record to DB", dbError);
    }

    revalidateTag("gallery-images-6", "max");
    return jsonResponse({ url: data.publicUrl, path, persisted: true });
  }

  return jsonResponse(
    {
      message:
        "Konfigurasi Supabase Storage belum lengkap. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY, lalu buat bucket public bernama kilapkendaraan.",
    },
    503,
  );
}
