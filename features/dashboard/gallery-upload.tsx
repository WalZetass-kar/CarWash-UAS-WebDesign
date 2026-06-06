"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";

export function GalleryUpload() {
  const csrfFetch = useCsrfFetch();
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    const response = await csrfFetch("/api/uploads/gallery", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(payload.message ?? "Upload gagal");
      return;
    }

    setPreview(payload.url);
    toast.success("Gambar gallery tersimpan");
  }

  return (
    <div className="space-y-4">
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
        <ImageUp className="mb-2 size-7 text-cyan-600" />
        <span className="font-medium text-slate-700 dark:text-slate-200">
          Upload gambar gallery
        </span>
        <span className="mt-1">Maksimal 2MB, hanya jpg, jpeg, png, webp.</span>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          className="sr-only"
          disabled={loading}
        />
      </label>

      {preview ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <Image src={preview} alt="Preview gallery upload" fill className="object-cover" unoptimized />
        </div>
      ) : null}

      <Button variant="outline" disabled>
        {loading ? "Memvalidasi..." : "Tampil di gallery publik setelah tersimpan"}
      </Button>
    </div>
  );
}
