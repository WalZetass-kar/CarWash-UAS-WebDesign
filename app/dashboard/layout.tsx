import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireSession } from "@/lib/auth/session";
import { getAppSettings } from "@/services/settings";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const [session, settings] = await Promise.all([requireSession(), getAppSettings()]);

  return (
    <DashboardShell user={session.user} brandName={settings.businessName}>
      {children}
    </DashboardShell>
  );
}
