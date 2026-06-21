import { notFound } from "next/navigation";
import { CustomerHistoryView } from "@/features/customers/customer-history";
import { requireRole } from "@/lib/auth/session";
import { loadWithTimeoutFallback } from "@/lib/runtime/load-with-timeout";
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
    return await loadWithTimeoutFallback(() => getCustomerHistory(id), {
      fallback: () => null,
      label: "customer history page data",
      timeoutMs: 2500,
    });
  } catch (error) {
    console.error("Failed to load customer history page data", error);
    return null;
  }
}
