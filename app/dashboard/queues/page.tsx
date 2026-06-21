import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { QueueManager } from "@/features/queues/queue-manager";
import { loadWithTimeoutFallback } from "@/lib/runtime/load-with-timeout";
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
    const [queues, customers, packages] = await Promise.all([
      loadWithTimeoutFallback(() => listQueues(), {
        fallback: () => [],
        label: "queues page queues",
        timeoutMs: 2500,
      }),
      loadWithTimeoutFallback(() => listCustomers(), {
        fallback: () => [],
        label: "queues page customers",
        timeoutMs: 2500,
      }),
      loadWithTimeoutFallback(() => listPackages(), {
        fallback: () => [],
        label: "queues page packages",
        timeoutMs: 2500,
      }),
    ]);

    return [queues, customers, packages] as const;
  } catch (error) {
    console.error("Failed to load queues page data", error);
    return [[], [], []] as const;
  }
}
