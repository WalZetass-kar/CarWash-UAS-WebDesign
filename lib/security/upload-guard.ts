const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
const maxBytes = 2 * 1024 * 1024;

export type UploadGuardResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
    };

export function validateUploadFile(file: File): UploadGuardResult {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !allowedExtensions.includes(extension)) {
    return { ok: false, reason: "Ekstensi file tidak diizinkan." };
  }

  if (!allowedMimeTypes.includes(file.type)) {
    return { ok: false, reason: "MIME type file tidak valid." };
  }

  if (file.size > maxBytes) {
    return { ok: false, reason: "Ukuran file maksimal 2MB." };
  }

  return { ok: true };
}
