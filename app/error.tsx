"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="id">
      <body className="grid min-h-screen place-items-center bg-slate-50 p-4 text-slate-950">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 size-10 text-rose-600" />
          <h1 className="text-xl font-semibold">Terjadi kesalahan</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sistem mencatat error sederhana di console. Coba muat ulang proses.
          </p>
          <Button className="mt-5" onClick={reset}>
            Coba Lagi
          </Button>
        </div>
      </body>
    </html>
  );
}
