import { connection } from "next/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireSession } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/constants";
import { listOperationalNotifications } from "@/services/notifications";
import { getAppSettings } from "@/services/settings";
import { loadWithTimeoutFallback } from "@/lib/runtime/load-with-timeout";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await requireSession();
  const shellData = await loadDashboardShellData();

  return (
    <DashboardShell
      user={session.user}
      brandName={shellData.settings.businessName || APP_NAME}
      notifications={shellData.notifications}
    >
      {children}
    </DashboardShell>
  );
}

async function loadDashboardShellData() {
  try {
    const [settings, notifications] = await Promise.all([
      loadWithTimeoutFallback(() => getAppSettings(), {
        fallback: () => ({
          id: "app-settings",
          businessName: "",
          businessPhone: "",
          businessAddress: "",
          queueSlotCapacity: 1,
          reportDefaultRangeDays: 1,
          autoPrintInvoice: false,
          invoiceFooter: "",
        }),
        label: "dashboard shell settings",
        timeoutMs: 2500,
      }),
      loadWithTimeoutFallback(() => listOperationalNotifications(), {
        fallback: () => [],
        label: "dashboard shell notifications",
        timeoutMs: 2500,
      }),
    ]);

    return { settings, notifications };
  } catch (error) {
    console.error("Failed to load dashboard shell data", error);
    return {
      settings: {
        id: "app-settings",
        businessName: APP_NAME,
        businessPhone: "",
        businessAddress: "",
        queueSlotCapacity: 1,
        reportDefaultRangeDays: 1,
        autoPrintInvoice: false,
        invoiceFooter: "",
      },
      notifications: [],
    };
  }
}
