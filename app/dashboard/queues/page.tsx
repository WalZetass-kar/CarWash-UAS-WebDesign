import { Badge } from "@/components/ui/badge";
import { QueueManager } from "@/features/queues/queue-manager";
import { listCustomers } from "@/services/customers";
import { listPackages } from "@/services/packages";
import { listQueues } from "@/services/queues";

export const metadata = {
  title: "Antrian Pencucian",
};

export default async function QueuesPage() {
  const [queues, customers, packages] = await Promise.all([listQueues(), listCustomers(), listPackages()]);

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
      />
    </div>
  );
}
