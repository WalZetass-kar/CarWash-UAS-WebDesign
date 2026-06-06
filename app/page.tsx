import { connection } from "next/server";
import { unstable_cache } from "next/cache";
import { hasDatabaseConfig, isDemoModeEnabled } from "@/drizzle/db";
import { LandingPage } from "@/components/landing/landing-page";
import { defaultAppSettings, demoPackages } from "@/lib/data";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { listGalleryImages } from "@/services/gallery";
import { listPackages } from "@/services/packages";
import { getAppSettings } from "@/services/settings";

export default async function Home() {
  await connection();
  
  // Parallel fetching to reduce wait time
  const [settings, packages, gallery] = await Promise.all([
    loadLandingSettings(),
    loadLandingPackages(),
    listGalleryImages(),
  ]);

  return (
    <LandingPage
      brandName={settings.businessName}
      packages={JSON.parse(JSON.stringify(packages.filter((item) => item.isActive)))}
      gallery={gallery}
    />
  );
}

async function loadLandingSettings() {
  return unstable_cache(
    async () => {
      if (!hasDatabaseConfig() && !isDemoModeEnabled()) return defaultAppSettings;

      try {
        return await withDatabaseRetry(() => getAppSettings(), 2);
      } catch (error) {
        console.error("Failed to load landing settings", error);
        return defaultAppSettings;
      }
    },
    ["landing-settings"],
    { revalidate: 3600 },
  )();
}

async function loadLandingPackages() {
  return unstable_cache(
    async () => {
      if (!hasDatabaseConfig() && !isDemoModeEnabled()) return demoPackages;

      try {
        return await withDatabaseRetry(() => listPackages(), 2);
      } catch (error) {
        console.error("Failed to load landing packages", error);
        return demoPackages;
      }
    },
    ["landing-packages"],
    { revalidate: 3600 },
  )();
}
