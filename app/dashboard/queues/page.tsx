import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { BackendSetupNotice } from "@/components/runtime/backend-setup-notice";
import { QueueManager } from "@/features/queues/queue-manager";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { listCustomers } from "@/services/customers";
import { listPackages } from "@/services/packages";
import { listQueues } from "@/services/queues";

export const metadata = {
  title: "Antrian Pencucian",
};

export default async function QueuesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; highlight?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const data = await loadQueuesData();
  if (!data) return <BackendSetupNotice area="dashboard" compact issue="connection-error" />;

  const [queues, customers, packages] = data;

  return (
    <div className="space-y-6">
      <div>
        <Badge>Supabase Realtime</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Antrian Pencucian</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Nomor antrian otomatis, Flatpickr jadwal, status realtime, dan riwayat lengkap.
        </p>
      </div>
      <QueueManager
        initialQueues={JSON.parse(JSON.stringify(queues))}
        customers={JSON.parse(JSON.stringify(customers))}
        packages={JSON.parse(JSON.stringify(packages))}
        initialSearch={params.query ?? ""}
        highlightedId={params.highlight ?? ""}
      />
    </div>
  );
}

async function loadQueuesData() {
  try {
    return await withDatabaseRetry(async () => {
      const queues = await listQueues();
      const customers = await listCustomers();
      const packages = await listPackages();
      return [queues, customers, packages] as const;
    });
  } catch (error) {
    console.error("Failed to load queues page data", error);
    return null;
  }
}
