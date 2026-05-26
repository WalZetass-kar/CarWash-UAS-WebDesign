import { DatabaseZap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export function BackendSetupNotice({
  area,
  compact = false,
}: {
  area: "dashboard" | "booking";
  compact?: boolean;
}) {
  const title =
    area === "dashboard"
      ? "Dashboard belum bisa dipakai"
      : "Booking publik belum bisa dipakai";

  const description =
    area === "dashboard"
      ? "Route dashboard butuh koneksi database aktif. Saat ini DATABASE_URL belum tersedia di environment deployment."
      : "Halaman booking butuh paket dan pengaturan dari database. Saat ini DATABASE_URL belum tersedia di environment deployment.";

  const wrapperClass = compact
    ? "rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
    : "mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100";

  return (
    <div className={wrapperClass}>
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">
          <DatabaseZap className="size-5" />
        </div>
        <div className="space-y-3">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-100/85">{description}</p>
          </div>
          <div className="rounded-lg border border-amber-300/70 bg-white/70 p-3 text-sm dark:border-amber-400/20 dark:bg-slate-950/30">
            <p className="font-medium">{APP_NAME} memerlukan konfigurasi minimum berikut di Vercel:</p>
            <p className="mt-2 font-mono text-xs sm:text-sm">DATABASE_URL</p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-100/85">
              Setelah env diisi, jalankan migrasi atau seed yang sesuai lalu redeploy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
