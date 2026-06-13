"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCsrfFetch } from "@/hooks/use-csrf-fetch";

export function DangerZone() {
  const router = useRouter();
  const csrfFetch = useCsrfFetch();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    const response = await csrfFetch("/api/settings/reset-data", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const payload = await response.json();
    setLoading(false);
    setConfirming(false);

    if (!response.ok) {
      toast.error(payload.message ?? "Gagal menghapus data");
      return;
    }

    const d = payload.deleted;
    toast.success(
      `Data berhasil dihapus: ${d.customers} pelanggan, ${d.queues} antrian, ${d.transactions} transaksi, ${d.payments} pembayaran, ${d.activityLogs} log, ${d.gallery} gallery.`
    );
    router.refresh();
  }

  return (
    <Card className="border-red-200 dark:border-red-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="size-5" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Hapus semua data operasional: pelanggan, antrian, transaksi, pembayaran, log aktivitas, dan gallery.
          Data user, paket cuci, dan pengaturan tidak akan terpengaruh.
        </p>
        {confirming ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <p className="mb-3 text-sm font-medium text-red-700 dark:text-red-300">
              Yakin ingin menghapus SEMUA data operasional? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReset}
                disabled={loading}
              >
                <Trash2 className="size-4" />
                {loading ? "Menghapus..." : "Ya, Hapus Semua"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={loading}
              >
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={handleReset}
          >
            <Trash2 className="size-4" />
            Hapus Semua Data Operasional
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
