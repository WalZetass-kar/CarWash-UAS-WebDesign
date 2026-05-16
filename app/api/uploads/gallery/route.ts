import { NextRequest } from "next/server";
import { jsonResponse, rejectInvalidCsrf, requireApiRole } from "@/app/api/_utils";
import { validateUploadFile } from "@/lib/security/upload-guard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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
    const { error } = await supabase.storage.from("cleanride").upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return jsonResponse(
        {
          message:
            "Upload Supabase gagal. Pastikan bucket public bernama cleanride sudah dibuat.",
          detail: error.message,
        },
        500,
      );
    }

    const { data } = supabase.storage.from("cleanride").getPublicUrl(path);
    return jsonResponse({ url: data.publicUrl, path, persisted: true });
  }

  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  return jsonResponse({
    url: dataUrl,
    path,
    persisted: false,
    message: "Mode demo: file tervalidasi, tetapi belum disimpan permanen karena Supabase belum dikonfigurasi.",
  });
}
