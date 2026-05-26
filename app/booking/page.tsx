import { Badge } from "@/components/ui/badge";
import { PublicBookingForm } from "@/features/bookings/public-booking-form";
import { getAppSettings } from "@/services/settings";
import { listPackages } from "@/services/packages";

export const metadata = {
  title: "Booking Publik",
};

function toPackageSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const params = await searchParams;
  const [settings, packages] = await Promise.all([getAppSettings(), listPackages()]);
  const activePackages = packages.filter((item) => item.isActive);
  const selectedPackage =
    activePackages.find((item) => toPackageSlug(item.name) === params.package) ?? activePackages[0];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Badge>Customer Booking</Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Pilih paket dan booking jadwal
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Pengunjung publik bisa membuat booking tanpa login. Dashboard tetap dipakai admin dan petugas untuk operasional internal.
          </p>
        </div>
        {activePackages.length ? (
          <PublicBookingForm
            packages={JSON.parse(JSON.stringify(activePackages))}
            brandName={settings.businessName}
            initialPackageId={selectedPackage?.id}
          />
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            Belum ada paket aktif yang bisa dibooking dari halaman publik. Silakan hubungi admin atau aktifkan paket dari dashboard.
          </div>
        )}
      </div>
    </main>
  );
}
