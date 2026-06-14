import { Badge } from "@/components/ui/badge";
import { PublicBookingForm } from "@/features/bookings/public-booking-form";
import { defaultAppSettings } from "@/lib/data";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
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

  const data = await loadBookingData();
  if (!data) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6">
          <div>
            <Badge>Customer Booking</Badge>
            <h1 className="mt-3 max-w-3xl break-words text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Pilih paket dan booking jadwal
            </h1>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            Data booking belum bisa dimuat. Halaman akan tetap tampil setelah server membaca koneksi database.
          </div>
        </div>
      </main>
    );
  }

  const [settings, packages] = data;
  const activePackages = packages.filter((item) => item.isActive);
  const selectedPackage =
    activePackages.find((item) => toPackageSlug(item.name) === params.package) ?? activePackages[0];

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl min-w-0 space-y-6">
        <div>
          <Badge>Customer Booking</Badge>
          <h1 className="mt-3 max-w-3xl break-words text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
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

async function loadBookingData() {
  try {
    return await withDatabaseRetry(async () => {
      const settings = await getAppSettings();
      const packages = await listPackages();
      return [settings, packages] as const;
    });
  } catch (error) {
    console.error("Failed to load booking page data", error);
    return [
      {
        ...defaultAppSettings,
        businessName: "",
        businessPhone: "",
        businessAddress: "",
        queueSlotCapacity: 1,
        reportDefaultRangeDays: 1,
        autoPrintInvoice: false,
        invoiceFooter: "",
      },
      [],
    ] as const;
  }
}
