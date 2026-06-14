"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">Dashboard belum bisa dimuat</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Coba muat ulang dashboard. Kalau masih gagal, kembali ke beranda lalu buka lagi menu admin.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => unstable_retry()}>
            <RotateCcw className="mr-2 size-4" />
            Muat Ulang
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 size-4" />
              Ke Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
