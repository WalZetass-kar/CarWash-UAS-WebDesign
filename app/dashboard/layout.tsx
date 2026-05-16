import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireSession } from "@/lib/auth/session";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
