import { DatabaseZap } from "lucide-react";
import { getDatabaseEnvHint } from "@/lib/runtime/database-config";

export function BackendSetupNotice({
  area,
  compact = false,
  issue = "missing-config",
}: {
  area: "dashboard" | "booking";
  compact?: boolean;
  issue?: "missing-config" | "connection-error";
}) {
  const title =
    area === "dashboard"
      ? "Data dashboard belum bisa dimuat"
      : "Booking publik belum bisa dimuat";

  const descriptions = {
    dashboard:
      issue === "missing-config"
        ? "Server belum membaca env database di deployment, jadi data dashboard belum bisa diambil."
        : "Koneksi atau query database gagal saat memuat data dashboard.",
    booking:
      issue === "missing-config"
        ? "Server belum membaca env database di deployment, jadi paket booking belum bisa diambil."
        : "Koneksi atau query database gagal saat memuat data booking.",
  };

  const actionText =
    issue === "missing-config"
      ? "Isi salah satu env database yang didukung di Vercel, jalankan migrasi bila perlu, lalu redeploy."
      : "Periksa status database, akses jaringan, SSL/pooling, serta migrasi atau seed yang dibutuhkan.";

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
            <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-100/85">{descriptions[area]}</p>
          </div>
          <div className="rounded-lg border border-amber-300/70 bg-white/70 p-3 text-sm dark:border-amber-400/20 dark:bg-slate-950/30">
            <p className="font-medium">
              Detail teknis koneksi database:
            </p>
            <p className="mt-2 font-mono text-xs sm:text-sm">{getDatabaseEnvHint()}</p>
            <p className="mt-2 text-amber-800/90 dark:text-amber-100/85">
              Kalau deploy di Vercel, pastikan env itu diisi pada Production Environment dan deploy ulang setelah perubahan.
            </p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-100/85">{actionText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
