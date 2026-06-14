import { connection } from "next/server";
import { hasDatabaseConfig } from "@/drizzle/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BackendSetupNotice } from "@/components/runtime/backend-setup-notice";
import { requireSession } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { listOperationalNotifications } from "@/services/notifications";
import { getAppSettings } from "@/services/settings";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await requireSession();

  if (!hasDatabaseConfig()) {
    return (
      <DashboardShell user={session.user} brandName={APP_NAME}>
        <BackendSetupNotice area="dashboard" compact />
      </DashboardShell>
    );
  }

  const shellData = await loadDashboardShellData();
  if (!shellData) {
    return (
      <DashboardShell user={session.user} brandName={APP_NAME}>
        <BackendSetupNotice area="dashboard" compact issue="connection-error" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      user={session.user}
      brandName={shellData.settings.businessName}
      notifications={shellData.notifications}
    >
      {children}
    </DashboardShell>
  );
}

async function loadDashboardShellData() {
  try {
    return await withDatabaseRetry(async () => ({
      settings: await getAppSettings(),
      notifications: await listOperationalNotifications(),
    }));
  } catch (error) {
    console.error("Failed to load dashboard shell data", error);
    return null;
  }
}
