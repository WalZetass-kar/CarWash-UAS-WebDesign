import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GalleryUpload } from "@/features/dashboard/gallery-upload";
import { requireRole } from "@/lib/auth/session";

export const metadata = {
  title: "Pengaturan",
};

export default async function SettingsPage() {
  await requireRole(["admin"]);

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
            <p>Dashboard akan memakai mode demo bila environment Supabase belum diisi.</p>
            <p>Preferensi dark mode tersimpan via next-themes localStorage.</p>
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
    </div>
  );
}
