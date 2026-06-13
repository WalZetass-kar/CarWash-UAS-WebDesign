import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { BackendSetupNotice } from "@/components/runtime/backend-setup-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryUpload } from "@/features/dashboard/gallery-upload";
import { DangerZone } from "@/features/settings/danger-zone";
import { SettingsManager } from "@/features/settings/settings-manager";
import { requireRole } from "@/lib/auth/session";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { getAppSettings } from "@/services/settings";

export const metadata = {
  title: "Pengaturan",
};

export default async function SettingsPage() {
  await connection();
  await requireRole(["admin"]);
  const settings = await loadSettingsData();
  if (!settings) return <BackendSetupNotice area="dashboard" compact issue="connection-error" />;

  return (
    <div className="space-y-6">
      <div>
        <Badge>Admin Only</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Pengaturan Sistem</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Konfigurasi operasional, keamanan upload, cookie, dan preferensi tema.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <SettingsManager initialSettings={JSON.parse(JSON.stringify(settings))} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Keamanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>JWT disimpan dalam HTTPOnly cookies dengan SameSite Lax dan Secure di production.</p>
            <p>Session otomatis invalid setelah pergantian tanggal pukul 00:00 Asia/Jakarta.</p>
            <p>Upload guard membatasi file maksimal 2MB: jpg, jpeg, png, webp.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Realtime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>Supabase Realtime tersambung ke tabel queues dan payments.</p>
            <p>Slot antrian saat ini dibatasi {settings.queueSlotCapacity} kendaraan per jam.</p>
            <p>Invoice otomatis: {settings.autoPrintInvoice ? "aktif" : "manual"}.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upload Gallery Aman</CardTitle>
          </CardHeader>
          <CardContent>
            <GalleryUpload />
          </CardContent>
        </Card>
      </div>
      <DangerZone />
    </div>
  );
}

async function loadSettingsData() {
  try {
    return await withDatabaseRetry(() => getAppSettings());
  } catch (error) {
    console.error("Failed to load settings page data", error);
    return null;
  }
}
