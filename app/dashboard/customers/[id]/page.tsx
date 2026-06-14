import { notFound } from "next/navigation";
import { CustomerHistoryView } from "@/features/customers/customer-history";
import { requireRole } from "@/lib/auth/session";
import { withDatabaseRetry } from "@/lib/runtime/database-retry";
import { getCustomerHistory } from "@/services/customer-history";

export const metadata = {
  title: "Riwayat Pelanggan",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "petugas"]);
  const { id } = await params;
  const data = await loadCustomerHistoryData(id);

  if (!data) notFound();

  return <CustomerHistoryView data={JSON.parse(JSON.stringify(data))} />;
}

async function loadCustomerHistoryData(id: string) {
  try {
    return await withDatabaseRetry(() => getCustomerHistory(id));
  } catch (error) {
    console.error("Failed to load customer history page data", error);
    return null;
  }
}
