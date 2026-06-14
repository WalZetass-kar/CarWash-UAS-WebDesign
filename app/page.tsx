import { connection } from "next/server";
import { hasDatabaseConfig } from "@/drizzle/db";
import { LandingPage } from "@/components/landing/landing-page";
import { APP_NAME } from "@/lib/constants";
import { defaultAppSettings, type AppSettings } from "@/lib/data";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { listGalleryImages } from "@/services/gallery";
import { listPackages } from "@/services/packages";
import { getAppSettings } from "@/services/settings";

export default async function Home() {
  await connection();

  const [settings, packages, gallery] = await Promise.all([
    loadLandingSettings(),
    loadLandingPackages(),
    loadLandingGallery(),
  ]);

  return (
    <LandingPage
      brandName={settings.businessName || APP_NAME}
      packages={JSON.parse(JSON.stringify(packages.filter((item) => item.isActive)))}
      gallery={gallery}
    />
  );
}

async function loadLandingSettings() {
  if (!hasDatabaseConfig()) return getEmptyLandingSettings();

  try {
    return await withDatabaseRetry(() => getAppSettings(), 2);
  } catch (error) {
    console.error("Failed to load landing settings", error);
    return getEmptyLandingSettings();
  }
}

async function loadLandingPackages() {
  if (!hasDatabaseConfig()) return [];

  try {
    return await withDatabaseRetry(() => listPackages(), 2);
  } catch (error) {
    console.error("Failed to load landing packages", error);
    return [];
  }
}

function getEmptyLandingSettings(): AppSettings {
  return {
    ...defaultAppSettings,
    businessName: APP_NAME,
    businessPhone: "",
    businessAddress: "",
    queueSlotCapacity: 1,
    reportDefaultRangeDays: 1,
    autoPrintInvoice: false,
    invoiceFooter: "",
  };
}

async function loadLandingGallery() {
  try {
    return await listGalleryImages();
  } catch (error) {
    console.warn("Failed to load landing gallery", error);
    return [];
  }
}
