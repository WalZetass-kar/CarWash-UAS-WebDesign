import { connection } from "next/server";
import { hasDatabaseConfig } from "@/drizzle/db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BackendSetupNotice } from "@/components/runtime/backend-setup-notice";
import { requireSession } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";
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

  const settings = await getAppSettings();

  return (
    <DashboardShell user={session.user} brandName={settings.businessName}>
      {children}
    </DashboardShell>
  );
}
